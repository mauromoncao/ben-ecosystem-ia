#!/bin/bash
# ============================================================
# BEN AGENTS — Atualizar API Keys no VPS (versão segura)
# Execute este script diretamente no Console VPS (Hostinger)
#
# INSTRUÇÃO: Antes de executar, certifique-se que o arquivo
# /opt/ben-agents-server/.env já existe com as chaves reais,
# OU edite as variáveis na seção "CONFIGURE AQUI" abaixo.
#
# Atualizado: 2026-03-15
# ============================================================

AGENTS_DIR="/opt/ben-agents-server"

echo "📝 Verificando .env do Ben Agents Server..."

# Se o .env já existe com conteúdo, apenas reinicia
if [ -f "$AGENTS_DIR/.env" ] && [ -s "$AGENTS_DIR/.env" ]; then
  echo "✅ .env já existe. Reiniciando servidor..."
  pm2 restart ben-agents-server 2>/dev/null || pm2 start "$AGENTS_DIR/index.js" --name ben-agents-server
  sleep 3
  curl -s http://localhost:3188/health
  echo ""
  echo "✅ Ben Agents Server atualizado!"
  exit 0
fi

echo "⚠️  .env não encontrado. Criando estrutura base..."
echo "   ⚡ ATENÇÃO: Substitua os valores XXXX pelas chaves reais após executar!"

# Criar estrutura .env base (sem chaves reais — preencher manualmente no VPS)
cat > "$AGENTS_DIR/.env" << 'ENVBASE'
# BEN Agents Server v6.0 — Produção
# INSTRUÇÃO: Preencha os valores XXXX com as chaves reais
NODE_ENV=production
PORT=3188

OPENAI_API_KEY=PREENCHER_CHAVE_OPENAI
ANTHROPIC_API_KEY=PREENCHER_CHAVE_ANTHROPIC
PERPLEXITY_API_KEY=PREENCHER_CHAVE_PERPLEXITY
GEMINI_API_KEY=PREENCHER_CHAVE_GEMINI

ELEVENLABS_API_KEY=PREENCHER_CHAVE_ELEVENLABS
ELEVENLABS_VOICE_ID=03sDpb9vJLiEzU47xieQP

PINECONE_API_KEY=PREENCHER_CHAVE_PINECONE
PINECONE_INDEX_HOST=https://ben-memory-mjdzd1i.svc.aped-4627-b74a.pinecone.io

RESEND_API_KEY=PREENCHER_CHAVE_RESEND
ESCRITORIO_EMAIL=contato@mauromoncao.adv.br

ESCAVADOR_TOKEN=PREENCHER_TOKEN_ESCAVADOR
ASAAS_TOKEN=PREENCHER_TOKEN_ASAAS
ASAAS_API_KEY=PREENCHER_TOKEN_ASAAS
ZAPSIGN_TOKEN=PREENCHER_TOKEN_ZAPSIGN

META_TOKEN=PREENCHER_META_TOKEN
META_PHONE_ID=1056574384196557
META_WA_BUSINESS_ID=11722581750040939
META_VERIFY_TOKEN=drben2026
META_ACCESS_TOKEN=PREENCHER_META_ACCESS_TOKEN
META_AD_ACCOUNT_ID=474763217204147
META_PIXEL_ID=1249768107002017

ZAPI_INSTANCE_ID=3EF9A739D73341583F7A5A285E74165C
ZAPI_TOKEN=PREENCHER_ZAPI_TOKEN
ZAPI_CLIENT_TOKEN=PREENCHER_ZAPI_CLIENT_TOKEN
ZAPI_PHONE=5586994820054
MARA_ZAPI_INSTANCE_ID=PREENCHER_MARA_INSTANCE_ID
MARA_ZAPI_TOKEN=PREENCHER_MARA_ZAPI_TOKEN

GOOGLE_CLIENT_ID=PREENCHER_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=PREENCHER_GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN=PREENCHER_GOOGLE_REFRESH_TOKEN
GOOGLE_ADS_DEVELOPER_TOKEN=PREENCHER_GOOGLE_ADS_TOKEN
GOOGLE_ADS_MCC_ID=1048763500
GOOGLE_ADS_CUSTOMER_ID=3843720833

CORS_ORIGINS=https://ecosystem.mauromoncao.adv.br,https://juris.mauromoncao.adv.br,https://bengrowth.mauromoncao.adv.br,https://hub.mauromoncao.adv.br
VPS_LEADS_URL=http://localhost:3001
VPS_PORTAL_URL=http://localhost:3600
MONITOR_ADMIN_TOKEN=PREENCHER_MONITOR_TOKEN
JWT_SECRET=ben_jwt_mauro_moncao_2026_enterprise_secret_key_advogados
ENVBASE

echo ""
echo "⚠️  Arquivo .env criado com estrutura base em: $AGENTS_DIR/.env"
echo "   Edite as chaves: nano $AGENTS_DIR/.env"
echo ""
echo "   Após preencher as chaves reais, execute novamente este script."
echo "   Ou execute: pm2 restart ben-agents-server"
