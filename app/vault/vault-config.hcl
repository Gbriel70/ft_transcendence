# Configuração do Vault (modo desenvolvimento - NÃO USE EM PRODUÇÃO)

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

ui = true

# Modo dev (auto-unseal)
disable_mlock = true