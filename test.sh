#!/bin/bash

echo "╔═══════════════════════════════════════════╗"
echo "║  🧪 TESTES FOCADOS - AUTH SERVICE         ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Função auxiliar
print_test() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  📝 $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================
# TESTE 1: INFRAESTRUTURA
# ============================================

print_test "TESTE 1: Infraestrutura - Containers Necessários"

echo "→ Verificando container 'vault'..."
if docker ps | grep -q "vault.*healthy"; then
    print_success "Vault está UP e healthy"
else
    print_error "Vault NÃO está rodando ou não está healthy"
fi

echo ""
echo "→ Verificando container 'postgres'..."
if docker ps | grep -q "postgres.*healthy"; then
    print_success "PostgreSQL está UP e healthy"
else
    print_error "PostgreSQL NÃO está rodando ou não está healthy"
fi

echo ""
echo "→ Verificando container 'auth_service'..."
if docker ps | grep -q "auth_service.*Up"; then
    print_success "Auth Service está UP"
    
    # Verificar se não está em restart loop
    RESTART_COUNT=$(docker inspect --format='{{.RestartCount}}' auth_service)
    if [ "$RESTART_COUNT" -gt 3 ]; then
        print_warning "Auth Service reiniciou $RESTART_COUNT vezes (pode haver problemas)"
    fi
else
    print_error "Auth Service NÃO está rodando"
    echo ""
    echo "→ Logs do Auth Service:"
    docker logs auth_service 2>&1 | tail -20
    exit 1
fi

# ============================================
# TESTE 2: VAULT - TOKEN E SECRETS
# ============================================

print_test "TESTE 2: Vault - Token e Secrets"

echo "→ Verificando se Vault está unsealed..."
if docker exec vault vault status | grep -q "Sealed.*false"; then
    print_success "Vault está unsealed"
else
    print_error "Vault está SEALED"
fi

echo ""
echo "→ Verificando root token..."
TOKEN=$(docker exec vault cat /vault/data/vault-keys.env 2>/dev/null | grep VAULT_ROOT_TOKEN | cut -d= -f2)
if [ -n "$TOKEN" ]; then
    print_success "Root token encontrado (${TOKEN:0:20}...)"
else
    print_error "Root token NÃO encontrado"
fi

echo ""
echo "→ Verificando secret 'database'..."
if docker exec -e VAULT_TOKEN=$TOKEN vault vault kv get secret/database > /dev/null 2>&1; then
    print_success "Secret 'database' existe no Vault"
    
    echo ""
    echo "   📄 Conteúdo:"
    docker exec -e VAULT_TOKEN=$TOKEN vault vault kv get -format=json secret/database | jq '.data.data' | sed 's/^/   /'
else
    print_error "Secret 'database' NÃO encontrado"
fi

echo ""
echo "→ Verificando secret 'jwt'..."
if docker exec -e VAULT_TOKEN=$TOKEN vault vault kv get secret/jwt > /dev/null 2>&1; then
    print_success "Secret 'jwt' existe no Vault"
    
    JWT_SECRET=$(docker exec -e VAULT_TOKEN=$TOKEN vault vault kv get -format=json secret/jwt | jq -r '.data.data.secret')
    echo "   🔑 JWT Secret (primeiros 20 chars): ${JWT_SECRET:0:20}..."
else
    print_error "Secret 'jwt' NÃO encontrado"
fi

echo ""
echo "→ Verificando secret 'auth'..."
if docker exec -e VAULT_TOKEN=$TOKEN vault vault kv get secret/auth > /dev/null 2>&1; then
    print_success "Secret 'auth' existe no Vault"
else
    print_error "Secret 'auth' NÃO encontrado"
fi

# ============================================
# TESTE 3: POSTGRESQL - CONEXÃO E SCHEMA
# ============================================

print_test "TESTE 3: PostgreSQL - Conexão e Schema"

echo "→ Testando conexão com PostgreSQL..."
if docker exec postgres pg_isready -U admin -d minibank_db > /dev/null 2>&1; then
    print_success "PostgreSQL aceita conexões"
else
    print_error "PostgreSQL NÃO aceita conexões"
fi

echo ""
echo "→ Verificando database 'minibank_db'..."
if docker exec postgres psql -U admin -d minibank_db -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database 'minibank_db' existe"
else
    print_error "Database 'minibank_db' NÃO existe"
fi

echo ""
echo "→ Verificando tabela 'users'..."
if docker exec postgres psql -U admin -d minibank_db -c "\dt" 2>/dev/null | grep -q "users"; then
    print_success "Tabela 'users' existe"
    
    # Mostrar estrutura da tabela
    echo ""
    echo "   📋 Estrutura da tabela 'users':"
    docker exec postgres psql -U admin -d minibank_db -c "\d users" | sed 's/^/   /'
    
    # Contar usuários
    USER_COUNT=$(docker exec postgres psql -U admin -d minibank_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    echo ""
    echo "   👥 Usuários cadastrados: $USER_COUNT"
else
    print_warning "Tabela 'users' NÃO existe (será criada no primeiro registro)"
fi

# ============================================
# TESTE 4: AUTH SERVICE - CONECTIVIDADE
# ============================================

print_test "TESTE 4: Auth Service - Conectividade"

echo "→ Auth Service consegue pingar Vault?"
if docker exec auth_service ping -c 2 vault > /dev/null 2>&1; then
    print_success "Auth → Vault: OK"
else
    print_error "Auth → Vault: FALHOU"
fi

echo ""
echo "→ Auth Service consegue pingar PostgreSQL?"
if docker exec auth_service ping -c 2 postgres > /dev/null 2>&1; then
    print_success "Auth → PostgreSQL: OK"
else
    print_error "Auth → PostgreSQL: FALHOU"
fi

echo ""
echo "→ Auth Service responde na porta 3001?"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Auth Service responde HTTP"
else
    print_error "Auth Service NÃO responde HTTP"
fi

# ============================================
# TESTE 5: AUTH SERVICE - LOGS E CONFIGURAÇÃO
# ============================================

print_test "TESTE 5: Auth Service - Logs e Configuração"

echo "→ Verificando logs do Auth Service..."
echo ""
echo "   📄 Últimas 15 linhas dos logs:"
docker logs auth_service 2>&1 | tail -15 | sed 's/^/   /'

echo ""
echo "→ Auth Service carregou configuração do Vault?"
if docker logs auth_service 2>&1 | grep -q "Service config loaded"; then
    print_success "Configuração do Vault carregada"
else
    print_warning "Configuração do Vault NÃO foi carregada (usando fallback)"
fi

echo ""
echo "→ Auth Service conectou ao PostgreSQL?"
if docker logs auth_service 2>&1 | grep -q "Connected to PostgreSQL\|Database initialized"; then
    print_success "Conexão com PostgreSQL estabelecida"
else
    print_error "ERRO ao conectar com PostgreSQL"
    
    echo ""
    echo "   🔍 Erros relacionados a PostgreSQL:"
    docker logs auth_service 2>&1 | grep -i "error.*postgres\|password authentication failed" | tail -5 | sed 's/^/   /'
fi

echo ""
echo "→ Auth Service tem JWT Secret configurado?"
if docker logs auth_service 2>&1 | grep -q "JWT Secret configured: Yes"; then
    print_success "JWT Secret está configurado"
elif docker logs auth_service 2>&1 | grep -q "JWT Secret configured"; then
    print_error "JWT Secret NÃO está configurado"
else
    print_warning "Não foi possível verificar JWT Secret nos logs"
fi

# ============================================
# TESTE 6: API - HEALTH CHECK
# ============================================

print_test "TESTE 6: API - Health Check"

echo "→ GET /health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)

if [ $? -eq 0 ]; then
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
    
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        print_success "Health check retornou 'ok'"
    else
        print_error "Health check NÃO retornou 'ok'"
    fi
else
    print_error "Falha ao acessar /health"
fi

# ============================================
# TESTE 7: API - REGISTRO DE USUÁRIO
# ============================================

print_test "TESTE 7: API - Registro de Usuário"

EMAIL="test_$(date +%s)@minibank.com"
PASSWORD="Test123!"
NAME="Test User"

echo "→ POST /register (email: $EMAIL)..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\"
  }")

echo ""
echo "   📤 Request:"
echo "   {\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}" | jq '.' | sed 's/^/   /'

echo ""
echo "   📥 Response:"
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null | sed 's/^/   /' || echo "   $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | jq -e '.user.id' > /dev/null 2>&1; then
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
    print_success "Usuário registrado com sucesso (ID: $USER_ID)"
else
    print_error "Falha ao registrar usuário"
    
    if echo "$REGISTER_RESPONSE" | grep -q "Email already exists"; then
        print_warning "Email já existe (normal se executar testes múltiplas vezes)"
    fi
fi

# ============================================
# TESTE 8: API - LOGIN
# ============================================

print_test "TESTE 8: API - Login de Usuário"

echo "→ POST /login (email: $EMAIL)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo ""
echo "   📤 Request:"
echo "   {\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | jq '.' | sed 's/^/   /'

echo ""
echo "   📥 Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null | sed 's/^/   /' || echo "   $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    print_success "Login bem-sucedido"
    
    echo ""
    echo "   🎫 Token JWT gerado:"
    echo "   ${JWT_TOKEN:0:60}..."
    
    # Validar estrutura do JWT
    TOKEN_PARTS=$(echo "$JWT_TOKEN" | tr '.' '\n' | wc -l)
    if [ "$TOKEN_PARTS" -eq 3 ]; then
        print_success "Token JWT tem estrutura válida (3 partes)"
    else
        print_error "Token JWT inválido (tem $TOKEN_PARTS partes, deveria ter 3)"
    fi
else
    print_error "Falha no login"
    
    # Ver logs do auth para diagnosticar
    echo ""
    echo "   🔍 Últimos logs do Auth Service:"
    docker logs auth_service 2>&1 | tail -10 | sed 's/^/   /'
fi

# ============================================
# TESTE 9: API - LOGIN COM SENHA ERRADA
# ============================================

print_test "TESTE 9: API - Validação de Senha Incorreta"

echo "→ POST /login (senha errada)..."
WRONG_LOGIN=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"WrongPassword123!\"
  }")

echo ""
echo "   📥 Response:"
echo "$WRONG_LOGIN" | jq '.' 2>/dev/null | sed 's/^/   /' || echo "   $WRONG_LOGIN"

if echo "$WRONG_LOGIN" | grep -q "Invalid email or password"; then
    print_success "Senha incorreta foi rejeitada corretamente"
else
    print_error "Senha incorreta NÃO foi rejeitada (vulnerabilidade!)"
fi

# ============================================
# TESTE 10: API - VALIDAÇÕES
# ============================================

print_test "TESTE 10: API - Validações de Input"

echo "→ POST /register (sem email)..."
RESPONSE=$(curl -s -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"password":"Test123!","name":"Test"}')

if echo "$RESPONSE" | grep -q "Missing required fields"; then
    print_success "Validação de campos obrigatórios funciona"
else
    print_warning "Validação pode não estar funcionando corretamente"
fi

echo ""
echo "→ POST /login (sem senha)..."
RESPONSE=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

if echo "$RESPONSE" | grep -q "Missing email or password"; then
    print_success "Validação de campos de login funciona"
else
    print_warning "Validação pode não estar funcionando corretamente"
fi

echo ""
echo "→ POST /login (usuário inexistente)..."
RESPONSE=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"naoexiste@test.com","password":"Test123!"}')

if echo "$RESPONSE" | grep -q "Invalid credentials"; then
    print_success "Usuário inexistente retorna erro correto"
else
    print_warning "Mensagem de erro pode revelar se email existe (vulnerabilidade)"
fi

# ============================================
# TESTE 11: SEGURANÇA - VAULT ACCESS
# ============================================

print_test "TESTE 11: Segurança - Acesso ao Vault"

echo "→ Tentando acessar Vault sem token..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8200/v1/secret/data/database)

if [ "$RESPONSE" -eq 403 ]; then
    print_success "Vault bloqueia acesso sem token (403)"
else
    print_error "VULNERABILIDADE! Vault acessível sem token (HTTP $RESPONSE)"
fi

echo ""
echo "→ Tentando acessar Vault com token inválido..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-Vault-Token: invalid_token" \
  http://localhost:8200/v1/secret/data/database)

if [ "$RESPONSE" -eq 403 ]; then
    print_success "Vault rejeita token inválido (403)"
else
    print_error "VULNERABILIDADE! Token inválido aceito (HTTP $RESPONSE)"
fi

# ============================================
# TESTE 12: PERFORMANCE BÁSICA
# ============================================

print_test "TESTE 12: Performance Básica"

echo "→ Testando tempo de resposta do /health (10 requisições)..."

TOTAL_TIME=0
for i in {1..10}; do
    START=$(date +%s%N)
    curl -s http://localhost:3001/health > /dev/null
    END=$(date +%s%N)
    TIME=$((($END - $START) / 1000000))  # Converter para ms
    TOTAL_TIME=$(($TOTAL_TIME + $TIME))
done

AVG_TIME=$(($TOTAL_TIME / 10))

echo "   ⏱️  Tempo médio: ${AVG_TIME}ms"

if [ "$AVG_TIME" -lt 100 ]; then
    print_success "Tempo de resposta excelente (< 100ms)"
elif [ "$AVG_TIME" -lt 500 ]; then
    print_success "Tempo de resposta bom (< 500ms)"
else
    print_warning "Tempo de resposta alto (> 500ms)"
fi

# ============================================
# RESUMO FINAL
# ============================================

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║           📊 RESUMO DOS TESTES            ║"
echo "╠═══════════════════════════════════════════╣"
printf "║  ${GREEN}✅ Passaram: %-3d${NC}                        ║\n" $PASSED
printf "║  ${RED}❌ Falharam: %-3d${NC}                        ║\n" $FAILED
echo "╚═══════════════════════════════════════════╝"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 TODOS OS TESTES DO AUTH PASSARAM! 🎉  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  ALGUNS TESTES FALHARAM              ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    echo "💡 Dicas de troubleshooting:"
    echo "   • Ver logs completos: docker logs auth_service"
    echo "   • Ver logs do Vault: docker logs vault"
    echo "   • Ver logs do PostgreSQL: docker logs postgres"
    echo "   • Reiniciar serviços: docker-compose restart auth_service"
    exit 1
fi