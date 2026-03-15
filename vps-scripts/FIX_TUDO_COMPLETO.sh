#!/bin/bash
# ============================================================
# BEN ECOSYSTEM — Fix Completo: DB + Painéis Admin + Nginx
# VPS Hostinger: 181.215.135.202
# 
# CORRIGE:
#   [1] PostgreSQL: senha do ben_admin
#   [2] Reinicia porta 3003 (portal-api)  
#   [3] Reinstala solucoes-painel no port 3030
#   [4] Instala blog-painel-admin na porta 3040
#   [5] Configura nginx para portaldocliente
#
# COMO USAR:
#   bash FIX_TUDO_COMPLETO.sh
# ============================================================
set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${CYAN}[BEN]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; }

echo -e "${CYAN}============================================================="
echo " BEN ECOSYSTEM — Fix Completo $(date '+%Y-%m-%d %H:%M')"
echo -e "=============================================================${NC}"

DB_PASS="Ben@Workspace2026!Secure"

# ────────────────────────────────────────────────────────────
# [1] CORRIGIR SENHA DO ben_admin NO POSTGRESQL
# ────────────────────────────────────────────────────────────
log "[1/5] Corrigindo PostgreSQL ben_admin..."
sudo -u postgres psql << PGEOF
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'ben_admin') THEN
    EXECUTE 'ALTER ROLE ben_admin WITH LOGIN PASSWORD ''${DB_PASS}''';
    RAISE NOTICE 'OK: ben_admin senha atualizada';
  ELSE
    EXECUTE 'CREATE ROLE ben_admin LOGIN PASSWORD ''${DB_PASS}''';
    RAISE NOTICE 'OK: ben_admin criado';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ben_portal OWNER ben_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ben_portal') \gexec

SELECT 'CREATE DATABASE ben_workspace OWNER ben_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ben_workspace') \gexec

GRANT ALL PRIVILEGES ON DATABASE ben_portal TO ben_admin;
GRANT ALL PRIVILEGES ON DATABASE ben_workspace TO ben_admin;
\q
PGEOF
ok "PostgreSQL: ben_admin senha = Ben@Workspace2026!Secure"

# ────────────────────────────────────────────────────────────
# [2] FIX PORTAL-API (porta 3003) — atualizar .env e reiniciar
# ────────────────────────────────────────────────────────────
log "[2/5] Corrigindo portal-api (porta 3003)..."
for PDIR in /opt/ben-portal-server /opt/portal-api /opt/portal-server; do
  if [ -d "$PDIR" ]; then
    if [ -f "$PDIR/.env" ]; then
      sed -i "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" "$PDIR/.env" 2>/dev/null || true
      sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" "$PDIR/.env" 2>/dev/null || true
      sed -i "s|ben_admin:[^@]*@|ben_admin:${DB_PASS}@|g" "$PDIR/.env" 2>/dev/null || true
      ok "  $PDIR/.env atualizado"
    fi
  fi
done
pm2 restart ben-portal 2>/dev/null && ok "ben-portal reiniciado" || warn "ben-portal não encontrado no PM2"

# ────────────────────────────────────────────────────────────
# [3] INSTALAR/CORRIGIR SOLUCOES-PAINEL (porta 3030)
# ────────────────────────────────────────────────────────────
log "[3/5] Instalando solucoes-painel-admin (porta 3030)..."

SOLUCOES_DIR="/opt/solucoes-painel-admin"
mkdir -p "$SOLUCOES_DIR"

# Install Node.js if not present
if ! command -v node &>/dev/null; then
  warn "Node.js não encontrado. Instalando..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Check if PM2 is installed
if ! command -v pm2 &>/dev/null; then
  warn "PM2 não encontrado. Instalando..."
  npm install -g pm2
fi

# Clone/pull solucoes-painel-admin from GitHub
if [ -d "$SOLUCOES_DIR/.git" ]; then
  cd "$SOLUCOES_DIR" && git pull origin main 2>/dev/null || true
else
  rm -rf "$SOLUCOES_DIR"
  git clone https://github.com/mauromoncao/solucoes-painel-admin.git "$SOLUCOES_DIR" 2>/dev/null || {
    warn "GitHub clone falhou. Usando diretório existente..."
  }
fi

if [ -d "$SOLUCOES_DIR" ]; then
  cd "$SOLUCOES_DIR"
  
  # Create .env
  cat > .env << ENVEOF
DATABASE_URL=postgresql://ben_admin:${DB_PASS}@localhost:5432/solucoes_admin?sslmode=disable
JWT_SECRET=${BLOG_JWT_SECRET:-PREENCHER_JWT_SECRET_VIA_ENV}
PORT=3030
NODE_ENV=production
CORS_ORIGIN=https://solucoes-painel.mauromoncao.adv.br
ENVEOF
  
  # Install and build
  npm install --prefer-offline 2>/dev/null || npm install
  npm run build 2>/dev/null || warn "Build falhou"
  
  # Create DB if needed
  sudo -u postgres psql -c "SELECT 'CREATE DATABASE solucoes_admin OWNER ben_admin' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'solucoes_admin') \gexec" 2>/dev/null || true
  
  # Start with PM2
  pm2 delete solucoes-painel 2>/dev/null || true
  pm2 start node --name solucoes-painel -- dist/server/index.js 2>/dev/null || \
  pm2 start "node --experimental-strip-types server/index.ts" --name solucoes-painel 2>/dev/null || \
  warn "Falha ao iniciar solucoes-painel"
  
  ok "solucoes-painel-admin configurado"
fi

# ────────────────────────────────────────────────────────────
# [4] INSTALAR BLOG-PAINEL-ADMIN (porta 3040)
# ────────────────────────────────────────────────────────────
log "[4/5] Instalando blog-painel-admin (porta 3040)..."

BLOG_DIR="/opt/blog-painel-admin"
mkdir -p "$BLOG_DIR"

if [ -d "$BLOG_DIR/.git" ]; then
  cd "$BLOG_DIR" && git pull origin main 2>/dev/null || true
else
  rm -rf "$BLOG_DIR"
  git clone https://github.com/mauromoncao/blog-painel-admin.git "$BLOG_DIR" 2>/dev/null || {
    warn "GitHub clone do blog-painel falhou."
  }
fi

if [ -d "$BLOG_DIR" ]; then
  cd "$BLOG_DIR"
  
  # Create DB for blog
  sudo -u postgres psql << BLOGDB
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'blog_admin') THEN
    EXECUTE 'CREATE ROLE blog_admin LOGIN PASSWORD ''${BLOG_DB_PASS:-PREENCHER_SENHA_BLOG}''';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE blog_mauro OWNER blog_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'blog_mauro') \gexec
GRANT ALL PRIVILEGES ON DATABASE blog_mauro TO blog_admin;
\q
BLOGDB

  # Create .env
  cat > .env << BENVEOF
DATABASE_URL=postgresql://blog_admin:${BLOG_DB_PASS:-PREENCHER_SENHA_BLOG}%40Adv@localhost:5432/blog_mauro?sslmode=disable
JWT_SECRET=${BLOG_JWT_SECRET:-PREENCHER_JWT_SECRET_VIA_ENV}
GOOGLE_CLIENT_ID=${BLOG_GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${BLOG_GOOGLE_CLIENT_SECRET}
PORT=3040
NODE_ENV=production
CORS_ORIGIN=https://blog-painel.mauromoncao.adv.br
BENVEOF

  # Install and build  
  npm install --prefer-offline 2>/dev/null || npm install
  npm run build 2>/dev/null || warn "Build falhou"

  # Start with PM2
  pm2 delete blog-painel 2>/dev/null || true
  pm2 start node --name blog-painel -- dist/server/index.js 2>/dev/null || \
  warn "Falha ao iniciar blog-painel"

  ok "blog-painel-admin configurado na porta 3040"
fi

# ────────────────────────────────────────────────────────────
# [5] CONFIGURAR NGINX PARA portaldocliente.mauromoncao.adv.br
# ────────────────────────────────────────────────────────────
log "[5/5] Configurando nginx para portaldocliente..."

NGINX_CONF="/etc/nginx/sites-available/portaldocliente"
cat > "$NGINX_CONF" << 'NGINXCONF'
# Portal do Cliente — serve estático (CF Pages via proxy) ou API
server {
    listen 80;
    server_name portaldocliente.mauromoncao.adv.br;

    # Redirecionar / para HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name portaldocliente.mauromoncao.adv.br;

    ssl_certificate     /etc/letsencrypt/live/mauromoncao.adv.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mauromoncao.adv.br/privkey.pem;

    # Portal Cliente API (porta 3600) — proxear /api/*
    location /api/ {
        proxy_pass http://localhost:3600/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (pode ser servido localmente ou redirecionar para CF Pages)
    # Para servir de CF Pages diretamente via nginx proxy:
    location / {
        proxy_pass https://ben-portal-cliente.pages.dev;
        proxy_ssl_server_name on;
        proxy_set_header Host ben-portal-cliente.pages.dev;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINXCONF

# Enable site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/portaldocliente 2>/dev/null || true

# Test and reload nginx
nginx -t 2>/dev/null && systemctl reload nginx && ok "nginx configurado para portaldocliente" || warn "Verifique config nginx manualmente"

# ────────────────────────────────────────────────────────────
# SAVE PM2 AND STATUS
# ────────────────────────────────────────────────────────────
pm2 save 2>/dev/null || true
sleep 5

echo ""
echo -e "${GREEN}==================================================="
echo " STATUS FINAL — $(date '+%H:%M:%S')"
echo -e "===================================================${NC}"

pm2 list 2>/dev/null

echo ""
echo -e "${CYAN}Testando portas:${NC}"
for port in 3001 3002 3003 3030 3040 3188 3600; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:$port/health 2>/dev/null || echo "000")
  svc=$(curl -s --max-time 3 http://localhost:$port/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('service', d.get('status','?'))[:40])" 2>/dev/null || echo "?")
  [[ "$code" == "200" ]] \
    && echo -e "  ${GREEN}✅${NC} :$port → $code [$svc]" \
    || echo -e "  ${RED}❌${NC} :$port → $code"
done

echo ""
echo -e "${GREEN}Script concluído! $(date '+%Y-%m-%d %H:%M')${NC}"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
echo "  1. Conecte o repo ben-portal-cliente no CF Pages Dashboard"
echo "     URL: https://dash.cloudflare.com → Pages → Create Project"
echo "     Repo: github.com/mauromoncao/ben-portal-cliente"
echo "     Build command: npm run build"
echo "     Output dir: dist"
echo "     Var: VITE_API_URL = https://portal-api.mauromoncao.adv.br"
echo "  2. Adicione domínio personalizado: portaldocliente.mauromoncao.adv.br"
echo "  3. No Cloudflare DNS: delete o A record portaldocliente → 181.215.135.202"
echo "     E adicione CNAME portaldocliente → ben-portal-cliente.pages.dev"
