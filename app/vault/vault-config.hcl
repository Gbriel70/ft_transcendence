# ===== STORAGE ========#

storage "file" {
  path = "/vault/data"
}

# ===== LISTENER ========#
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

# ===== API ADDRESS =====#
api_addr = "http://0.0.0.0:8200"

# ========= UI ==========#
ui = true

# ===== LOG LEVEL =======#
log_level = "info"

# ===== DESABILITAR MLOCK (DOCKER) =====
disable_mlock = true