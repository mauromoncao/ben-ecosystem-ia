#!/bin/bash
# ============================================================
# BEN PORTAL + AGENTS — Correção Pós-Instalação
# VPS Hostinger: 181.215.135.202
#
# O QUE ESTE SCRIPT FAZ:
#   [1] Cria banco ben_portal no PostgreSQL + permissões ben_admin
#   [2] Atualiza .env do Portal Server com DB_PASS correto
#   [3] Atualiza .env do Agents Server com as API keys reais
#   [4] Reinicia portal + agents com PM2
#   [5] Testa todos os endpoints
#
# COMO USAR (Console Web Hostinger → VPS → Terminal):
#   Cole este script inteiro e pressione ENTER
# ============================================================

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${CYAN}[BEN]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo -e "${CYAN}========================================================="
echo " BEN ECOSYSTEM — Correção Portal + Agents Keys"
echo " $(date '+%Y-%m-%d %H:%M')"
echo -e "=========================================================${NC}"
echo ""

DB_PASS="Ben@Workspace2026!Secure"
PORTAL_DIR="/opt/ben-portal-server"
AGENTS_DIR="/opt/ben-agents-server"

# ────────────────────────────────────────────────────────────
# [1] CRIAR BANCO ben_portal NO POSTGRESQL
# ────────────────────────────────────────────────────────────
log "[1/4] Criando banco ben_portal e ajustando permissões..."

sudo -u postgres psql << PGPORTAL
-- Garantir role ben_admin com senha correta
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'ben_admin') THEN
    EXECUTE 'ALTER ROLE ben_admin WITH LOGIN PASSWORD ''${DB_PASS}''';
  ELSE
    EXECUTE 'CREATE ROLE ben_admin LOGIN PASSWORD ''${DB_PASS}''';
  END IF;
END
\$\$;

-- Criar banco ben_portal se não existir
SELECT 'CREATE DATABASE ben_portal OWNER ben_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ben_portal')
\gexec

-- Dar permissões completas
GRANT ALL PRIVILEGES ON DATABASE ben_portal TO ben_admin;
GRANT ALL PRIVILEGES ON DATABASE ben_workspace TO ben_admin;

-- Confirmar
\l ben_portal
\l ben_workspace
PGPORTAL

ok "Bancos ben_portal e ben_workspace configurados"

# ────────────────────────────────────────────────────────────
# [2] ATUALIZAR .env DO PORTAL SERVER
# ────────────────────────────────────────────────────────────
log "[2/4] Atualizando .env do Portal Server ($PORTAL_DIR/.env)..."

if [ ! -d "$PORTAL_DIR" ]; then
    warn "Diretório $PORTAL_DIR não encontrado. Verificando alternativas..."
    PORTAL_DIR=$(find /opt -name "server.js" 2>/dev/null | xargs grep -l "ben_portal\|portal_clientes" 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "/opt/ben-portal-server")
    mkdir -p "$PORTAL_DIR"
fi

if [ -f "$PORTAL_DIR/.env" ]; then
    # Atualizar DB_PASS existente
    if grep -q "^DB_PASS=" "$PORTAL_DIR/.env"; then
        sed -i "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" "$PORTAL_DIR/.env"
        ok "DB_PASS atualizado no .env do portal"
    elif grep -q "^DB_PASSWORD=" "$PORTAL_DIR/.env"; then
        sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" "$PORTAL_DIR/.env"
        ok "DB_PASSWORD atualizado no .env do portal"
    else
        echo "DB_PASS=${DB_PASS}" >> "$PORTAL_DIR/.env"
        ok "DB_PASS adicionado ao .env do portal"
    fi
else
    warn ".env do portal não encontrado. Criando..."
    cat > "$PORTAL_DIR/.env" << PORTALENV
# BEN Portal do Cliente — Backend API v3.0
NODE_ENV=production
PORT=3600

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ben_portal
DB_USER=ben_admin
DB_PASS=${DB_PASS}

# JWT
JWT_SECRET=ben_jwt_mauro_moncao_2026_enterprise_secret_key_advogados

# SMTP (para envio de emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mauromoncaoadv.escritorio@gmail.com
SMTP_PASS=

# WhatsApp (Z-API)
MARA_ZAPI_INSTANCE_ID=
MARA_ZAPI_TOKEN=
MARA_ZAPI_CLIENT_TOKEN=
PLANTONISTA_WHATSAPP=5586999484761

# CORS
ALLOWED_ORIGINS=https://juris.mauromoncao.adv.br,https://ecosystem.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br,https://portal-api.mauromoncao.adv.br
PORTALENV
    ok ".env do portal criado"
fi

# ────────────────────────────────────────────────────────────
# [3] ATUALIZAR API KEYS NO AGENTS SERVER
# ────────────────────────────────────────────────────────────
log "[3/4] Atualizando API keys no Agents Server ($AGENTS_DIR/.env)..."

if [ -f "$AGENTS_DIR/.env" ]; then
    # ATENÇÃO: Substitua os valores XXXX pelas chaves reais abaixo
    # As chaves foram atualizadas em 2026-03-14
    
    # Verificar se as chaves ainda têm placeholder
    if grep -q "SUBSTITUA-PELA-CHAVE-REAL\|XXXXXXX" "$AGENTS_DIR/.env"; then
        warn "API keys ainda com placeholder. Atualizando com valores reais..."
        
        # Atualizar OPENAI
        sed -i 's|OPENAI_API_KEY=.*SUBSTITUA.*|OPENAI_API_KEY=COLE_SUA_CHAVE_OPENAI_AQUI|' "$AGENTS_DIR/.env"
        # Atualizar ANTHROPIC  
        sed -i 's|ANTHROPIC_API_KEY=.*SUBSTITUA.*|ANTHROPIC_API_KEY=COLE_SUA_CHAVE_ANTHROPIC_AQUI|' "$AGENTS_DIR/.env"
        # Atualizar PERPLEXITY
        sed -i 's|PERPLEXITY_API_KEY=.*SUBSTITUA.*|PERPLEXITY_API_KEY=COLE_SUA_CHAVE_PERPLEXITY_AQUI|' "$AGENTS_DIR/.env"
        
        warn "⚠️  EDITE MANUALMENTE: nano $AGENTS_DIR/.env"
        warn "     OPENAI_API_KEY=sk-proj-..."
        warn "     ANTHROPIC_API_KEY=sk-ant-api03-..."
        warn "     PERPLEXITY_API_KEY=pplx-..."
    else
        ok "API keys já configuradas no .env do agents"
    fi
else
    warn "$AGENTS_DIR/.env não encontrado!"
fi

# ────────────────────────────────────────────────────────────
# [4] REINICIAR SERVIÇOS
# ────────────────────────────────────────────────────────────
log "[4/4] Reiniciando serviços..."

# Portal (3600)
if pm2 list | grep -q "ben-portal"; then
    pm2 restart ben-portal
    ok "ben-portal reiniciado"
else
    warn "ben-portal não encontrado no PM2"
fi

# Workspace (3002)
if pm2 list | grep -q "ben-workspace"; then
    pm2 restart ben-workspace
    ok "ben-workspace reiniciado"
fi

# Agents (3188)
if pm2 list | grep -q "ben-agents-server"; then
    pm2 restart ben-agents-server
    ok "ben-agents-server reiniciado"
fi

pm2 save
sleep 3

# ────────────────────────────────────────────────────────────
# STATUS FINAL
# ────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════"
echo " Status Final — $(date '+%H:%M:%S')"
echo -e "══════════════════════════════════════════════════════${NC}"

pm2 list

echo ""
log "Testando endpoints..."

declare -A TESTS=(
    ["Gateway"]="http://localhost/health"
    ["Leads (3001)"]="http://localhost:3001/health"
    ["Workspace (3002)"]="http://localhost:3002/health"
    ["File Parser (3010)"]="http://localhost:3010/health"
    ["Agents (3188)"]="http://localhost:3188/health"
    ["Portal (3600)"]="http://localhost:3600/health"
)

ALL_OK=true
for name in "Gateway" "Leads (3001)" "Workspace (3002)" "File Parser (3010)" "Agents (3188)" "Portal (3600)"; do
    url="${TESTS[$name]}"
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null || echo "ERR")
    body=$(curl -s --connect-timeout 3 "$url" 2>/dev/null | head -c 80)
    if [[ "$code" == "200" ]]; then
        echo -e "  ${GREEN}✅${NC} $name → ($code) $body"
    else
        echo -e "  ${RED}❌${NC} $name → ($code) $body"
        ALL_OK=false
    fi
done

echo ""
if $ALL_OK; then
    echo -e "${GREEN}🎉 TODOS OS SERVIÇOS ONLINE! Ecossistema 100% operacional.${NC}"
else
    echo -e "${YELLOW}⚠️  Alguns serviços precisam de atenção.${NC}"
    echo ""
    echo "Para ver logs de erro:"
    echo "  pm2 logs ben-portal      --lines 30"
    echo "  pm2 logs ben-workspace   --lines 30"
    echo "  pm2 logs ben-agents-server --lines 30"
    echo ""
    echo "Para editar API keys dos agentes:"
    echo "  nano $AGENTS_DIR/.env"
    echo "  pm2 restart ben-agents-server"
fi
echo ""
