#!/bin/bash
# ============================================================
# BEN AGENTS — Atualizar API Keys Reais
# Cole ESTE SCRIPT no Console VPS após substituir as chaves
#
# As chaves reais (conforme memória 2026-03-14):
#   OpenAI:     sk-proj--QsacKTO10qjv2... (válida)
#   Anthropic:  sk-ant-api03-zUNuAFmy...  (válida)
#   Perplexity: pplx-Erq9bMc2HNLWkNol... (válida)
# ============================================================

AGENTS_DIR="/opt/ben-agents-server"

# Reescrever .env completo com chaves reais
cat > "$AGENTS_DIR/.env" << 'ENVREAL'
# BEN Agents Server v6.0 — API Keys Produção
NODE_ENV=production
PORT=3188

# ── OPENAI ────────────────────────────────────────────────
OPENAI_API_KEY=COLE_AQUI_sk-proj--QsacKTO10qjv2...

# ── ANTHROPIC ─────────────────────────────────────────────
ANTHROPIC_API_KEY=COLE_AQUI_sk-ant-api03-zUNuAFmy...

# ── PERPLEXITY ────────────────────────────────────────────
PERPLEXITY_API_KEY=COLE_AQUI_pplx-Erq9bMc2HNLWkNol...

# ── CORS ──────────────────────────────────────────────────
CORS_ORIGINS=https://ecosystem.mauromoncao.adv.br,https://juris.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br,https://ben-agents-worker.mauromoncaoestudos.workers.dev

# ── VPS interna ────────────────────────────────────────────
VPS_LEADS_URL=http://localhost:3001
VPS_PORTAL_URL=http://localhost:3600
MONITOR_ADMIN_TOKEN=ben_monitor_mauro_2026_secure
ENVREAL

pm2 restart ben-agents-server
sleep 2
echo "Agents Server reiniciado. Testando..."
curl -s http://localhost:3188/health
echo ""
echo "✅ Pronto! Teste um agente:"
echo 'curl -X POST http://localhost:3188/agents/run -H "Content-Type: application/json" -d "{\"agentId\":\"ben-assistente-geral\",\"input\":\"Olá, teste de funcionamento\"}"'
