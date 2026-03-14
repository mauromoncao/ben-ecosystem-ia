#!/bin/bash
# ============================================================
# BEN ECOSYSTEM IA — Script de Correção e Instalação Completa
# VPS Hostinger: 181.215.135.202
# Executar via: Console Web Hostinger → VPS → Terminal
#
# O QUE ESTE SCRIPT FAZ (em ordem):
#   [1] Corrige Workspace API (porta 3002) — erro PostgreSQL ben_admin
#   [2] Instala/atualiza Ben Agents Server (porta 3188)
#   [3] Corrige configuração Nginx para as novas rotas
#   [4] Reinicia todos os serviços com PM2
#   [5] Exibe status final de tudo
#
# USO:
#   curl -fsSL https://raw.githubusercontent.com/mauromoncao/ben-growth-center/main/vps-workspace-server/install-workspace.sh | bash
#   OU copie e cole este arquivo completo no terminal VPS
# ============================================================

set -e
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${CYAN}[BEN]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[ERRO]${NC} $1"; }

echo ""
echo -e "${CYAN}========================================================="
echo " BEN ECOSYSTEM IA — Fix & Install VPS Completo"
echo " IP: 181.215.135.202 | Data: $(date '+%Y-%m-%d %H:%M')"
echo -e "=========================================================${NC}"
echo ""

# ────────────────────────────────────────────────────────────
# [1] CORRIGIR WORKSPACE API — PORTA 3002 (PostgreSQL ben_admin)
# ────────────────────────────────────────────────────────────
log "[1/5] Corrigindo Workspace API (porta 3002)..."

WORKSPACE_DIR="/opt/ben-workspace"
DB_NAME="ben_workspace"
DB_USER="ben_admin"
DB_PASS="Ben@Workspace2026!Secure"

# Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql 2>/dev/null; then
    warn "PostgreSQL não está ativo. Tentando iniciar..."
    systemctl start postgresql 2>/dev/null || apt-get install -y postgresql-16 2>/dev/null && systemctl start postgresql
fi

# Recriar usuário ben_admin com senha correta
log "Recriando usuário PostgreSQL ben_admin..."
sudo -u postgres psql << 'PGFIX'
-- Dropar e recriar role com senha correta
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'ben_admin') THEN
    EXECUTE 'ALTER ROLE ben_admin WITH LOGIN PASSWORD ''Ben@Workspace2026!Secure''';
    RAISE NOTICE 'Senha de ben_admin atualizada';
  ELSE
    EXECUTE 'CREATE ROLE ben_admin LOGIN PASSWORD ''Ben@Workspace2026!Secure''';
    RAISE NOTICE 'Role ben_admin criada';
  END IF;
END
$$;

-- Criar banco se não existir
SELECT 'CREATE DATABASE ben_workspace OWNER ben_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ben_workspace')
\gexec

-- Garantir permissões
GRANT ALL PRIVILEGES ON DATABASE ben_workspace TO ben_admin;
PGFIX

ok "PostgreSQL ben_admin corrigido"

# Atualizar .env do workspace com senha correta
if [ -f "$WORKSPACE_DIR/.env" ]; then
    log "Atualizando .env do workspace..."
    # Substituir DB_PASS se existir
    if grep -q "^DB_PASS=" "$WORKSPACE_DIR/.env"; then
        sed -i "s|^DB_PASS=.*|DB_PASS=${DB_PASS}|" "$WORKSPACE_DIR/.env"
    else
        echo "DB_PASS=${DB_PASS}" >> "$WORKSPACE_DIR/.env"
    fi
    ok ".env atualizado"
else
    warn "Diretório $WORKSPACE_DIR não encontrado, criando..."
    mkdir -p "$WORKSPACE_DIR"
    cat > "$WORKSPACE_DIR/.env" << ENVFILE
# BEN Workspace Backend
NODE_ENV=production
PORT=3002

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}

# JWT
JWT_SECRET=ben_jwt_mauro_moncao_2026_enterprise_secret_key_advogados

# OpenAI (para embeddings vetoriais)
OPENAI_API_KEY=sk-proj--QsacKTO10qjv2-SUBSTITUA-PELA-CHAVE-REAL

# Monitor admin token
MONITOR_ADMIN_TOKEN=ben_monitor_mauro_2026_secure

# CORS — origens permitidas
ALLOWED_ORIGINS=https://ecosystem.mauromoncao.adv.br,https://juris.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br,https://ben-ecosystem-ia.pages.dev,https://ben-juris-center.pages.dev,https://ben-growth-center.pages.dev,http://localhost:5173
ENVFILE
    ok ".env criado em $WORKSPACE_DIR/.env"
fi

# Reiniciar workspace se PM2 já existe
if pm2 list 2>/dev/null | grep -q "ben-workspace"; then
    pm2 restart ben-workspace
    ok "PM2 ben-workspace reiniciado"
else
    warn "PM2 ben-workspace não encontrado — será instalado no passo [4]"
fi

# ────────────────────────────────────────────────────────────
# [2] INSTALAR BEN AGENTS SERVER — PORTA 3188
# ────────────────────────────────────────────────────────────
log "[2/5] Instalando Ben Agents Server (porta 3188)..."

AGENTS_DIR="/opt/ben-agents-server"
mkdir -p "$AGENTS_DIR"

# Criar package.json
cat > "$AGENTS_DIR/package.json" << 'PKGJSON'
{
  "name": "ben-agents-server",
  "version": "6.0.0",
  "description": "BEN Ecosystem IA — Servidor de Agentes v6.0 (34 agentes)",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "node-fetch": "^3.3.2"
  }
}
PKGJSON

# Criar .env do Agents Server com as chaves ATUALIZADAS
cat > "$AGENTS_DIR/.env" << 'ENVAGENTS'
# BEN Agents Server v6.0
NODE_ENV=production
PORT=3188

# ── API Keys (atualizadas 2026-03-14) ─────────────────────
OPENAI_API_KEY=sk-proj--QsacKTO10qjv2-SUBSTITUA-PELA-CHAVE-REAL
ANTHROPIC_API_KEY=sk-ant-api03-zUNuAFmy-SUBSTITUA-PELA-CHAVE-REAL
PERPLEXITY_API_KEY=pplx-Erq9bMc2HNLWkNol-SUBSTITUA-PELA-CHAVE-REAL

# ── Configurações ──────────────────────────────────────────
CORS_ORIGINS=https://ecosystem.mauromoncao.adv.br,https://juris.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br,https://ben-agents-worker.mauromoncaoestudos.workers.dev

# ── VPS interna ────────────────────────────────────────────
VPS_LEADS_URL=http://localhost:3001
VPS_PORTAL_URL=http://localhost:3600
MONITOR_ADMIN_TOKEN=ben_monitor_mauro_2026_secure
ENVAGENTS

ok ".env do Agents Server criado — ATENÇÃO: atualize as API keys reais!"

# Criar server.js completo do Ben Agents Server v6.0
cat > "$AGENTS_DIR/server.js" << 'SERVERJS'
// ============================================================
// BEN AGENTS SERVER v6.0 — VPS Hostinger 181.215.135.202:3188
// 34 agentes: Jurídico + Contador + Perito + Growth + Sistema
// ============================================================
'use strict'
require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const app     = express()
const PORT    = process.env.PORT || 3188

// ── Middleware ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim())
    if (!origin || allowed.some(o => origin.startsWith(o))) return cb(null, true)
    cb(new Error('CORS bloqueado: ' + origin))
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ── Chaves de API ─────────────────────────────────────────
const OPENAI_KEY      = process.env.OPENAI_API_KEY      || ''
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY   || ''
const PERPLEXITY_KEY  = process.env.PERPLEXITY_API_KEY  || ''

// ── Mapa completo de Agentes ─────────────────────────────
const AGENTS = {
  // ── Jurídico ─────────────────────────────────────────────
  'ben-agente-operacional-maximus':  { provider:'anthropic', model:'claude-opus-4-5',   thinking:true,  system:'Você é o AGENTE OPERACIONAL MAXIMUS — análise jurídica de máxima profundidade. Use raciocínio estendido (thinking) para casos de última instância. Responda em português, com rigor técnico absoluto.' },
  'ben-agente-operacional-premium':  { provider:'anthropic', model:'claude-sonnet-4-5', thinking:false, system:'Você é o AGENTE OPERACIONAL PREMIUM — análise jurídica moderada a profunda. Thinking adaptativo. Sinaliza quando o Maximus é necessário. Responda em português com excelência técnica.' },
  'ben-agente-operacional-standard': { provider:'anthropic', model:'claude-haiku-4-5',  thinking:false, system:'Você é o AGENTE OPERACIONAL STANDARD — execução operacional rápida: extração, resumo, classificação, checklist. Responda em português de forma objetiva e estruturada.' },
  'ben-tributarista-estrategista':   { provider:'anthropic', model:'claude-opus-4-5',   thinking:true,  system:'Você é o AGENTE TRIBUTARISTA ESTRATEGISTA — especialista em Direito Tributário. Raciocínio em 7 camadas. Defesa no CARF, TJ, STJ e STF. Responda em português com profundidade máxima.' },
  'ben-processualista-estrategico':  { provider:'anthropic', model:'claude-opus-4-5',   thinking:true,  system:'Você é o AGENTE PROCESSUALISTA ESTRATÉGICO — estrategista processual nível STF/STJ. Análise em 6 camadas. Pipeline RAG para PDFs. Responda em português com estratégia máxima.' },
  'ben-pesquisador-juridico':        { provider:'perplexity', model:'sonar-pro',         system:'Você é o BEN Pesquisador Jurídico. Pesquise jurisprudência em tempo real: STF, STJ, TRF, TJPI. Cite fontes completas. Responda em português.' },
  // ── Contador ─────────────────────────────────────────────
  'ben-contador-tributarista':              { provider:'anthropic', model:'claude-haiku-4-5',  system:'BEN Contador — Triagem fiscal. Analise e classifique questões tributárias. Português, objetivo.' },
  'ben-contador-especialista':              { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Especialista — análise fiscal profunda. Legislação atualizada. Português.' },
  'ben-contador-planejamento':              { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Planejamento — planejamento tributário estratégico. Redução legal da carga tributária. Português.' },
  'ben-contador-creditos':                  { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Créditos — recuperação de créditos tributários. PIS/COFINS, IRPJ, CSLL. Português.' },
  'ben-contador-auditoria':                 { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Auditoria — auditoria fiscal completa. Conformidade e riscos. Português.' },
  'ben-contador-relatorio':                 { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Relatório — relatórios fiscais estruturados. Clareza e precisão. Português.' },
  'ben-contador-tributarista-planejamento': { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Tributarista Planejamento nível 2 — estratégias avançadas. Português.' },
  'ben-contador-tributarista-creditos':     { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Tributarista Créditos nível 2 — recuperação avançada. Português.' },
  'ben-contador-tributarista-auditoria':    { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Tributarista Auditoria nível 2 — auditoria avançada. Português.' },
  'ben-contador-tributarista-relatorio':    { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Contador Tributarista Relatório nível 2 — relatórios avançados. Português.' },
  // ── Perito Forense ───────────────────────────────────────
  'ben-perito-forense':           { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Perito Forense Padrão — laudos periciais técnicos. ABNT NBR. Português.' },
  'ben-perito-forense-profundo':  { provider:'anthropic', model:'claude-opus-4-5',   thinking:true,  system:'BEN Perito Forense Profundo — análise pericial máxima profundidade. Casos complexos. Português.' },
  'ben-perito-forense-digital':   { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Perito Forense Digital — perícia em sistemas, dados e evidências digitais. Português.' },
  'ben-perito-forense-laudo':     { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Perito Forense Laudo — elaboração de laudos técnicos estruturados. ABNT. Português.' },
  'ben-perito-forense-contestar': { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Perito Contraditório — contestação técnica de laudos adversos. Português.' },
  'ben-perito-forense-relatorio': { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Perito Relatório — relatórios periciais executivos. Português.' },
  'ben-perito-imobiliario':       { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Perito Imobiliário — avaliações ABNT NBR 14653. Mercado imobiliário. Português.' },
  // ── Growth & Marketing ───────────────────────────────────
  'ben-atendente':              { provider:'openai', model:'gpt-4o-mini', system:'BEN Atendente — atendimento jurídico humanizado 24/7. Triagem de leads. Português informal e acolhedor.' },
  'ben-conteudista':            { provider:'openai', model:'gpt-4o',      system:'BEN Conteudista Jurídico — artigos, posts e conteúdo para redes sociais. OAB-compliant. Português.' },
  'ben-estrategista-campanhas': { provider:'openai', model:'gpt-4o',      system:'BEN Estrategista Campanhas — Meta Ads e Google Ads para escritórios de advocacia. ROI máximo. Português.' },
  'ben-estrategista-marketing': { provider:'openai', model:'gpt-4o',      system:'BEN Estrategista Marketing — branding jurídico, redes sociais, posicionamento. Português.' },
  'ben-analista-relatorios':    { provider:'anthropic', model:'claude-haiku-4-5', system:'BEN Analista Relatórios — análise de KPIs, métricas de marketing, relatórios de performance. Português.' },
  'ben-diretor-criativo':       { provider:'openai', model:'gpt-4o',      system:'BEN Diretor Criativo — branding jurídico, identidade visual, campanhas criativas. Português.' },
  // ── Sistema / Suporte ────────────────────────────────────
  'ben-assistente-geral':       { provider:'openai', model:'gpt-4o',      system:'Você é o BEN Copilot — assistente universal do escritório Mauro Monção Advogados. Sem restrições temáticas. Responda em português com excelência.' },
  'ben-engenheiro-prompt':      { provider:'openai', model:'gpt-4o',      system:'BEN Engenheiro de Prompt — otimização de prompts, arquitetura de agentes IA, melhores práticas. Português técnico.' },
  'ben-analista-monitoramento': { provider:'anthropic', model:'claude-haiku-4-5', system:'BEN Analista Monitoramento — saúde do sistema, métricas, alertas. Análise técnica objetiva. Português.' },
  'ben-monitor-juridico':       { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Monitor Jurídico — monitoramento de publicações DJe e CNJ em tempo real. Analisa movimentações processuais. Português.' },
  'ben-assistente-cnj':         { provider:'anthropic', model:'claude-sonnet-4-5', system:'BEN Assistente CNJ DataJud — consultas ao DataJud e CNJ. Análise de movimentações processuais. Português.' },
  'ben-assistente-voz':         { provider:'anthropic', model:'claude-haiku-4-5', system:'BEN Assistente Voz — resposta clara e objetiva para síntese de voz. Sem markdown ou formatação. Português natural.' },
}

// ── Aliases retrocompatibilidade ─────────────────────────
const ALIASES = {
  'ben-super-agente-juridico': 'ben-agente-operacional-maximus',
  'ben-perito-ia':             'ben-perito-forense',
  'ben-contador-ia':           'ben-contador-especialista',
  'mara-ia':                   'ben-assistente-geral',
}

// ── Helper: OpenAI ────────────────────────────────────────
async function callOpenAI(model, systemPrompt, userInput, maxTokens = 4096) {
  const fetch = (await import('node-fetch')).default
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role:'system', content:systemPrompt }, { role:'user', content:userInput }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`OpenAI ${resp.status}: ${err.slice(0,200)}`)
  }
  const data = await resp.json()
  const choice = data.choices?.[0]
  return {
    output:       choice?.message?.content || '',
    modelUsed:    data.model || model,
    usage: {
      inputTokens:  data.usage?.prompt_tokens     || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      costUsd:      ((data.usage?.prompt_tokens || 0) * 0.000005 + (data.usage?.completion_tokens || 0) * 0.000015),
    },
  }
}

// ── Helper: Anthropic ─────────────────────────────────────
async function callAnthropic(model, systemPrompt, userInput, thinking = false, maxTokens = 8192) {
  const fetch = (await import('node-fetch')).default
  const body = {
    model,
    max_tokens: thinking ? 16000 : maxTokens,
    system: systemPrompt,
    messages: [{ role:'user', content:userInput }],
  }
  if (thinking) {
    body.thinking = { type:'enabled', budget_tokens: 10000 }
  }
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Anthropic ${resp.status}: ${err.slice(0,200)}`)
  }
  const data = await resp.json()
  const textBlock = data.content?.find(b => b.type === 'text')
  const output = textBlock?.text || ''
  const hasThinking = data.content?.some(b => b.type === 'thinking')
  return {
    output,
    modelUsed:  data.model || model,
    hasThinking,
    usage: {
      inputTokens:  data.usage?.input_tokens  || 0,
      outputTokens: data.usage?.output_tokens || 0,
      costUsd: model.includes('opus')
        ? ((data.usage?.input_tokens||0)*0.000015 + (data.usage?.output_tokens||0)*0.000075)
        : model.includes('sonnet')
        ? ((data.usage?.input_tokens||0)*0.000003 + (data.usage?.output_tokens||0)*0.000015)
        : ((data.usage?.input_tokens||0)*0.00000025 + (data.usage?.output_tokens||0)*0.00000125),
    },
  }
}

// ── Helper: Perplexity ────────────────────────────────────
async function callPerplexity(model, systemPrompt, userInput) {
  const fetch = (await import('node-fetch')).default
  const resp = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${PERPLEXITY_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role:'system', content:systemPrompt }, { role:'user', content:userInput }],
      max_tokens: 4096,
      temperature: 0.2,
      search_recency_filter: 'month',
    }),
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Perplexity ${resp.status}: ${err.slice(0,200)}`)
  }
  const data = await resp.json()
  const choice = data.choices?.[0]
  const citations = data.citations || []
  let output = choice?.message?.content || ''
  if (citations.length > 0) {
    output += '\n\n**Fontes:**\n' + citations.map((c,i) => `[${i+1}] ${c}`).join('\n')
  }
  return {
    output,
    modelUsed: data.model || model,
    citations,
    usage: {
      inputTokens:  data.usage?.prompt_tokens     || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      costUsd: ((data.usage?.prompt_tokens||0) * 0.000001 + (data.usage?.completion_tokens||0) * 0.000001),
    },
  }
}

// ════════════════════════════════════════════════════════════
// ROTAS
// ════════════════════════════════════════════════════════════

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status:    'online',
    service:   'Ben Agents Server',
    version:   '6.0.0',
    port:      PORT,
    agents:    Object.keys(AGENTS).length,
    timestamp: new Date().toISOString(),
  })
})

// Status dos agentes
app.get('/agents', (_req, res) => {
  const list = Object.entries(AGENTS).map(([id, cfg]) => ({
    id,
    provider: cfg.provider,
    model:    cfg.model,
    thinking: !!cfg.thinking,
  }))
  res.json({ total: list.length, agents: list })
})

// POST /agents/run — Executar agente
app.post('/agents/run', async (req, res) => {
  const start = Date.now()
  try {
    const { agentId, input, context = {}, modelOverride } = req.body || {}
    if (!agentId || !input) {
      return res.status(400).json({ success:false, error:'agentId e input são obrigatórios' })
    }

    // Resolver alias
    const resolvedId = ALIASES[agentId] || agentId
    const agent = AGENTS[resolvedId]
    if (!agent) {
      return res.status(404).json({ success:false, error:`Agente desconhecido: ${agentId}` })
    }

    console.log(`[Agents v6.0] ${agentId} → ${agent.provider}/${agent.model}`)

    // Enriquecer system prompt com contexto
    let systemPrompt = agent.system
    if (context?.processNumber) systemPrompt += `\n\nProcesso: ${context.processNumber}`
    if (context?.attachments?.length) {
      systemPrompt += `\n\nDocumentos anexados:\n`
      for (const att of context.attachments) {
        systemPrompt += `\n--- ${att.name} ---\n${att.text?.slice(0,8000)}\n`
      }
    }

    // Enriquecer input com contexto de conversa
    let enrichedInput = input
    if (context?.conversationHistory?.length) {
      const histStr = context.conversationHistory.slice(-6).map(m =>
        `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`
      ).join('\n')
      enrichedInput = `Histórico recente:\n${histStr}\n\nMensagem atual:\n${input}`
    }

    // Determinar modelo efetivo
    const effectiveModel = modelOverride || agent.model

    // Chamar provider correto
    let result
    if (agent.provider === 'openai') {
      result = await callOpenAI(effectiveModel, systemPrompt, enrichedInput)
    } else if (agent.provider === 'anthropic') {
      result = await callAnthropic(effectiveModel, systemPrompt, enrichedInput, !!agent.thinking)
    } else if (agent.provider === 'perplexity') {
      result = await callPerplexity(agent.model, systemPrompt, enrichedInput)
    } else {
      throw new Error(`Provider desconhecido: ${agent.provider}`)
    }

    const elapsed = Date.now() - start
    console.log(`[Agents v6.0] ${agentId} concluído em ${elapsed}ms | tokens=${result.usage?.inputTokens}+${result.usage?.outputTokens}`)

    return res.json({
      success:    true,
      output:     result.output,
      modelUsed:  result.modelUsed || effectiveModel,
      agentId:    resolvedId,
      elapsed_ms: elapsed,
      hasThinking: result.hasThinking || false,
      citations:   result.citations   || [],
      usage:       result.usage || {},
    })

  } catch (err) {
    const elapsed = Date.now() - start
    console.error(`[Agents v6.0] Erro (${elapsed}ms):`, err.message)
    return res.status(500).json({
      success:    false,
      error:      err.message || 'Erro interno do servidor de agentes',
      elapsed_ms: elapsed,
    })
  }
})

// ── Iniciar servidor ──────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════╗`)
  console.log(`║  BEN AGENTS SERVER v6.0 — ONLINE        ║`)
  console.log(`║  Porta: ${PORT}  |  Agentes: ${Object.keys(AGENTS).length}           ║`)
  console.log(`╚══════════════════════════════════════════╝\n`)
  console.log(`Providers configurados:`)
  console.log(`  OpenAI:     ${OPENAI_KEY     ? '✅' : '❌ FALTANDO'}`)
  console.log(`  Anthropic:  ${ANTHROPIC_KEY  ? '✅' : '❌ FALTANDO'}`)
  console.log(`  Perplexity: ${PERPLEXITY_KEY ? '✅' : '❌ FALTANDO'}`)
  console.log('')
})
SERVERJS

ok "server.js do Ben Agents Server criado"

# ── Instalar dependências ─────────────────────────────────
log "Instalando dependências Node.js em $AGENTS_DIR..."
cd "$AGENTS_DIR"

# Garantir Node.js 20
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
    log "Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

npm install --omit=dev --quiet
ok "Dependências instaladas"

# ────────────────────────────────────────────────────────────
# [3] CONFIGURAR NGINX (/agents/ → 3188)
# ────────────────────────────────────────────────────────────
log "[3/5] Configurando Nginx para porta 3188..."

NGINX_CONF="/etc/nginx/sites-available/ben-api"

# Verificar se Nginx existe
if ! command -v nginx &>/dev/null; then
    warn "Nginx não instalado. Instalando..."
    apt-get install -y nginx
fi

# Backup da configuração atual
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "${NGINX_CONF}.bkp.$(date +%Y%m%d%H%M)"
    ok "Backup Nginx criado"
fi

# Escrever nova configuração Nginx
cat > "$NGINX_CONF" << 'NGINXCONF'
# ============================================================
# BEN ECOSYSTEM IA — Nginx API Gateway
# VPS: 181.215.135.202
# ============================================================
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # ── Health check geral ──────────────────────────────────
    location = /health {
        return 200 '{"status":"API Gateway OK","vps":"181.215.135.202"}';
        add_header Content-Type application/json;
    }

    # ── Ben Agents Server (porta 3188) — NOVO ───────────────
    location /agents/ {
        proxy_pass         http://localhost:3188/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        add_header         Access-Control-Allow-Origin * always;
        add_header         Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
        add_header         Access-Control-Allow-Headers 'Content-Type, Authorization' always;
        if ($request_method = OPTIONS) { return 204; }
    }

    # ── Dr. Ben Leads API (porta 3001) ─────────────────────
    location /leads/ {
        proxy_pass         http://localhost:3001/leads/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    # ── Monitor API (porta 3001) ────────────────────────────
    location /monitor/ {
        proxy_pass         http://localhost:3001/monitor/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }

    # ── BEN File Parser (porta 3010) ────────────────────────
    location /upload/ {
        proxy_pass         http://localhost:3010/upload/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
        client_max_body_size 100M;
    }

    # ── Portal do Cliente (porta 3600) ─────────────────────
    location /portal/ {
        proxy_pass         http://localhost:3600/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    # ── Workspace API (porta 3002) ──────────────────────────
    location /workspace/ {
        proxy_pass         http://localhost:3002/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    # ── Fallback ────────────────────────────────────────────
    location / {
        return 200 '{"status":"API Gateway OK","endpoints":["/health","/agents/","/leads/","/monitor/","/upload/","/portal/","/workspace/"]}';
        add_header Content-Type application/json;
    }
}
NGINXCONF

# Ativar site
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ben-api
# Desabilitar default se existir
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar Nginx
nginx -t && nginx -s reload
ok "Nginx configurado e recarregado"

# ────────────────────────────────────────────────────────────
# [4] GERENCIAR SERVIÇOS COM PM2
# ────────────────────────────────────────────────────────────
log "[4/5] Gerenciando serviços com PM2..."

# Garantir PM2
if ! command -v pm2 &>/dev/null; then
    npm install -g pm2 -q
fi

# Agents Server (3188)
if pm2 list | grep -q "ben-agents-server"; then
    pm2 stop ben-agents-server
    pm2 delete ben-agents-server
fi
pm2 start "$AGENTS_DIR/server.js" \
    --name "ben-agents-server" \
    --restart-delay 3000 \
    --max-memory-restart 512M \
    --cwd "$AGENTS_DIR"
ok "ben-agents-server (porta 3188) iniciado"

# Workspace API (3002) — reiniciar se existe
if pm2 list | grep -q "ben-workspace"; then
    pm2 restart ben-workspace
    ok "ben-workspace (porta 3002) reiniciado"
fi

# Salvar PM2 e configurar startup
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

ok "PM2 configurado com startup automático"

# ────────────────────────────────────────────────────────────
# [5] STATUS FINAL
# ────────────────────────────────────────────────────────────
log "[5/5] Verificando status dos serviços..."
sleep 3

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════"
echo " ✅ BEN ECOSYSTEM IA — Status Final"
echo -e "══════════════════════════════════════════════════════${NC}"
echo ""

pm2 list
echo ""

# Testar endpoints
log "Testando endpoints..."
declare -A TESTS=(
    ["Agents Health"]="http://localhost:3188/health"
    ["Leads Health"]="http://localhost:3001/health"
    ["Workspace Health"]="http://localhost:3002/health"
    ["Portal Health"]="http://localhost:3600/health"
    ["Gateway"]="http://localhost/health"
)

for name in "${!TESTS[@]}"; do
    url="${TESTS[$name]}"
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null || echo "ERR")
    if [[ "$code" == "200" ]]; then
        echo -e "  ${GREEN}✅${NC} $name → $url ($code)"
    else
        echo -e "  ${RED}❌${NC} $name → $url ($code)"
    fi
done

echo ""
echo -e "${YELLOW}⚠️  AÇÕES MANUAIS NECESSÁRIAS:${NC}"
echo ""
echo "  1. Atualize as API keys reais no arquivo:"
echo "     nano $AGENTS_DIR/.env"
echo "     → OPENAI_API_KEY=sk-proj-..."
echo "     → ANTHROPIC_API_KEY=sk-ant-api03-..."
echo "     → PERPLEXITY_API_KEY=pplx-..."
echo ""
echo "  2. Após atualizar as keys:"
echo "     pm2 restart ben-agents-server"
echo ""
echo "  3. Verificar Workspace API (porta 3002):"
echo "     pm2 logs ben-workspace --lines 20"
echo "     Se ainda falhar: nano $WORKSPACE_DIR/.env"
echo ""
echo -e "${GREEN}Script concluído! $(date '+%Y-%m-%d %H:%M')${NC}"
echo ""
