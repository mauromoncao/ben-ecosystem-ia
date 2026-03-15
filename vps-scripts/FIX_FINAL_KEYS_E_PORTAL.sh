#!/bin/bash
# ============================================================
# BEN ECOSYSTEM — Fix Final: API Keys VPS + Portal 3600
# Cole TODO este bloco no terminal VPS e pressione ENTER
# ============================================================
set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${CYAN}[BEN]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }

echo -e "${CYAN}========================================================="
echo " BEN ECOSYSTEM — Fix Final $(date '+%Y-%m-%d %H:%M')"
echo -e "=========================================================${NC}"

AGENTS_DIR="/opt/ben-agents-server"
PORTAL_DIR="/opt/ben-portal-server"
DB_PASS="Ben@Workspace2026!Secure"

# ── [1] Atualizar .env dos Agentes com chaves reais ────────
# As chaves são passadas como variáveis de ambiente ao executar o script:
#   OPENAI_KEY=sk-... ANTHROPIC_KEY=sk-ant-... PPLX_KEY=pplx-... bash FIX_FINAL_KEYS_E_PORTAL.sh
# Ou o script lê do .env existente se as vars não forem passadas
log "[1/4] Atualizando API Keys no Agents Server..."

# Usar vars passadas ou ler do .env atual se existir
OAI="${OPENAI_KEY:-$(grep ^OPENAI_API_KEY $AGENTS_DIR/.env 2>/dev/null | cut -d= -f2-)}"
ANT="${ANTHROPIC_KEY:-$(grep ^ANTHROPIC_API_KEY $AGENTS_DIR/.env 2>/dev/null | cut -d= -f2-)}"
PPX="${PERPLEXITY_KEY:-$(grep ^PERPLEXITY_API_KEY $AGENTS_DIR/.env 2>/dev/null | cut -d= -f2-)}"

cat > "$AGENTS_DIR/.env" << ENVEOF
NODE_ENV=production
PORT=3188
OPENAI_API_KEY=${OAI}
ANTHROPIC_API_KEY=${ANT}
PERPLEXITY_API_KEY=${PPX}
CORS_ORIGINS=https://ecosystem.mauromoncao.adv.br,https://juris.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br,https://ben-agents-worker.mauromoncaoestudos.workers.dev
VPS_LEADS_URL=http://localhost:3001
VPS_PORTAL_URL=http://localhost:3600
MONITOR_ADMIN_TOKEN=ben_monitor_mauro_2026_secure
ENVEOF
ok "API Keys salvas em $AGENTS_DIR/.env"

# ── [2] Criar banco ben_portal + permissões ─────────────────
log "[2/4] Criando banco ben_portal no PostgreSQL..."
sudo -u postgres psql << PGEOF
DO \$\$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'ben_admin') THEN
    EXECUTE 'ALTER ROLE ben_admin WITH LOGIN PASSWORD ''${DB_PASS}''';
  ELSE
    EXECUTE 'CREATE ROLE ben_admin LOGIN PASSWORD ''${DB_PASS}''';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ben_portal OWNER ben_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ben_portal')
\gexec
GRANT ALL PRIVILEGES ON DATABASE ben_portal TO ben_admin;
GRANT ALL PRIVILEGES ON DATABASE ben_workspace TO ben_admin;
PGEOF
ok "banco ben_portal pronto"

# ── [3] Atualizar .env do Portal ────────────────────────────
log "[3/4] Atualizando .env do Portal Server..."
if [ -f "$PORTAL_DIR/.env" ]; then
  if grep -q "^DB_PASS=" "$PORTAL_DIR/.env"; then
    sed -i "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" "$PORTAL_DIR/.env"
  else
    echo "DB_PASS=${DB_PASS}" >> "$PORTAL_DIR/.env"
  fi
  ok ".env do portal atualizado"
else
  cat > "$PORTAL_DIR/.env" << PENV
NODE_ENV=production
PORT=3600
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ben_portal
DB_USER=ben_admin
DB_PASS=${DB_PASS}
JWT_SECRET=ben_jwt_mauro_moncao_2026_enterprise_secret_key_advogados
PLANTONISTA_WHATSAPP=5586999484761
ALLOWED_ORIGINS=https://juris.mauromoncao.adv.br,https://ecosystem.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br
PENV
  ok ".env do portal criado"
fi

# ── [4] Reiniciar todos os serviços ────────────────────────
log "[4/4] Reiniciando serviços com PM2..."
pm2 restart ben-agents-server 2>/dev/null && ok "ben-agents-server reiniciado" || echo "  ⚠️  ben-agents-server não encontrado"
pm2 restart ben-portal        2>/dev/null && ok "ben-portal reiniciado"        || echo "  ⚠️  ben-portal não encontrado"
pm2 restart ben-workspace     2>/dev/null && ok "ben-workspace reiniciado"     || echo "  ⚠️  ben-workspace não encontrado"
pm2 save
sleep 4

# ── Status Final ────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════"
echo " STATUS FINAL — $(date '+%H:%M:%S')"
echo -e "══════════════════════════════════════════════════════${NC}"
pm2 list
echo ""
log "Testando endpoints..."
for entry in \
  "Gateway|http://localhost/health" \
  "Leads  3001|http://localhost:3001/health" \
  "Workspace 3002|http://localhost:3002/health" \
  "Parser 3010|http://localhost:3010/health" \
  "Agents 3188|http://localhost:3188/health" \
  "Portal 3600|http://localhost:3600/health"
do
  name="${entry%%|*}"; url="${entry##*|}"
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null)
  body=$(curl -s --connect-timeout 3 "$url" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "?")
  [[ "$code" == "200" ]] \
    && echo -e "  ${GREEN}✅${NC} $name → $code [$body]" \
    || echo -e "  ${RED}❌${NC} $name → $code"
done

echo ""
log "Testando Agente IA (BEN Copilot)..."
RESP=$(curl -s -X POST http://localhost:3188/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"ben-assistente-geral","input":"Responda apenas: SISTEMA OK"}' \
  --connect-timeout 15 --max-time 30 2>/dev/null)
if echo "$RESP" | grep -q '"success":true'; then
  echo -e "  ${GREEN}✅ Agente IA respondendo! Motor OpenAI funcionando.${NC}"
  echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Resposta:', d.get('output','?')[:80])" 2>/dev/null
else
  echo -e "  ${RED}❌ Agente IA com erro:${NC}"
  echo "$RESP" | head -c 200
fi
echo ""
echo -e "${GREEN}Script concluído! $(date '+%Y-%m-%d %H:%M')${NC}"
