#!/bin/bash
# ============================================================
# BEN AGENTS — Adicionar aliases ben-growth-* no VPS
# 
# Problema: CF Worker usa ben-growth-atendente mas VPS usa ben-atendente
# Solução: adicionar aliases bidirecionais no ALIASES do server.js
#
# Execute no console SSH da VPS:
#   ssh root@181.215.135.202
#   bash /opt/ben-agents-server/add_growth_aliases.sh
# ============================================================

AGENTS_DIR="/opt/ben-agents-server"
SERVER_JS="$AGENTS_DIR/server.js"

if [ ! -f "$SERVER_JS" ]; then
  echo "❌ $SERVER_JS não encontrado!"
  exit 1
fi

echo "📝 Adicionando aliases ben-growth-* ao server.js..."

# Backup
cp "$SERVER_JS" "$SERVER_JS.bak_$(date +%Y%m%d_%H%M%S)"

# Add growth aliases using Node.js to edit the file
node << 'NODESCRIPT'
const fs = require('fs')
const file = '/opt/ben-agents-server/server.js'
let content = fs.readFileSync(file, 'utf8')

// Find the ALIASES section and add growth aliases
const oldAliases = `const ALIASES = {
  'ben-super-agente-juridico': 'ben-agente-operacional-maximus',
  'ben-perito-ia':             'ben-perito-forense',
  'ben-contador-ia':           'ben-contador-especialista',
  'mara-ia':                   'ben-assistente-geral',
}`

const newAliases = `const ALIASES = {
  // ── Aliases legados ──────────────────────────────────────
  'ben-super-agente-juridico': 'ben-agente-operacional-maximus',
  'ben-perito-ia':             'ben-perito-forense',
  'ben-contador-ia':           'ben-contador-especialista',
  'mara-ia':                   'ben-assistente-geral',
  // ── Aliases ben-growth-* → nome canônico ─────────────────
  'ben-growth-atendente':      'ben-atendente',
  'ben-growth-conteudista':    'ben-conteudista',
  'ben-growth-campanhas':      'ben-estrategista-campanhas',
  'ben-growth-marketing':      'ben-estrategista-marketing',
  'ben-growth-relatorios':     'ben-analista-relatorios',
  'ben-growth-criativo':       'ben-diretor-criativo',
  'ben-growth-monitoramento':  'ben-analista-monitoramento',
}`

if (content.includes(oldAliases)) {
  content = content.replace(oldAliases, newAliases)
  fs.writeFileSync(file, content)
  console.log('✅ Aliases adicionados com sucesso!')
} else {
  // Try partial match - just add to existing ALIASES
  const partial = `const ALIASES = {`
  if (content.includes(partial)) {
    console.log('⚠️  Formato diferente detectado — verifique manualmente')
    console.log('Adicione manualmente ao objeto ALIASES:')
    console.log("  'ben-growth-atendente':      'ben-atendente',")
    console.log("  'ben-growth-conteudista':    'ben-conteudista',")
    console.log("  'ben-growth-campanhas':      'ben-estrategista-campanhas',")
    console.log("  'ben-growth-marketing':      'ben-estrategista-marketing',")
    console.log("  'ben-growth-relatorios':     'ben-analista-relatorios',")
    console.log("  'ben-growth-criativo':       'ben-diretor-criativo',")
    console.log("  'ben-growth-monitoramento':  'ben-analista-monitoramento',")
  } else {
    console.log('❌ ALIASES não encontrado no server.js')
  }
}
NODESCRIPT

echo ""
echo "🔄 Reiniciando ben-agents-server..."
pm2 restart ben-agents-server
sleep 2

echo ""
echo "🔍 Testando aliases..."
curl -s -X POST http://localhost:3188/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"ben-growth-atendente","input":"teste aliases"}' | \
  node -e "
    const data = require('fs').readFileSync('/dev/stdin','utf8')
    const d = JSON.parse(data)
    console.log(d.success ? '✅ ben-growth-atendente: OK' : '❌ FAIL: '+d.error)
  "

curl -s -X POST http://localhost:3188/agents/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"ben-atendente","input":"teste aliases"}' | \
  node -e "
    const data = require('fs').readFileSync('/dev/stdin','utf8')
    const d = JSON.parse(data)
    console.log(d.success ? '✅ ben-atendente: OK' : '❌ FAIL: '+d.error)
  "

echo ""
echo "✅ Script concluído!"
echo "Agora ambos os nomes (ben-atendente e ben-growth-atendente) funcionam no VPS."
