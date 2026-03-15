#!/bin/bash
# ============================================================
# PRE-COMMIT SECURITY HOOK — BEN Ecosystem
# Bloqueia commits com segredos expostos (verifica apenas linhas ADICIONADAS)
# ============================================================

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔒 Verificando segredos antes do commit..."

SECRETS_FOUND=0

PATTERNS=(
  "sk-ant-api03-[A-Za-z0-9_-]{90,}"
  "sk-proj-[A-Za-z0-9_-]{90,}"
  "pplx-[A-Za-z0-9]{40,}"
  "AIzaSy[A-Za-z0-9_-]{33}"
  "GOCSPX-[A-Za-z0-9_-]{24,}"
  "pcsk_[A-Za-z0-9_]{50,}"
  "sk_[a-f0-9]{48}"
  "re_[A-Za-z0-9]{30,}"
  "\\\$aact_prod_[A-Za-z0-9:_-]{50,}"
  "426e787a-3446-4341-bbd2"
  "EAC44AD0F0FF58FCD"
  "EAAiZBZC-META-ACCESS-TOKEN"
  "EAAUIUsc-META-TOKEN"
  "1//04RV7R2u10E1PCgY"
  "eyJ0eXAiOiJKV1Q-ESCAVADOR-TOKEN"
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

for file in $STAGED_FILES; do
  if [[ "$file" == *".env.example"* ]] || [[ "$file" == *"SECURITY.md"* ]]; then
    continue
  fi
  
  # Only check ADDED lines (lines starting with + but not +++)
  ADDED_LINES=$(git diff --cached "$file" 2>/dev/null | grep "^+" | grep -v "^+++")
  
  for pattern in "${PATTERNS[@]}"; do
    if echo "$ADDED_LINES" | grep -qE "$pattern"; then
      echo -e "${RED}❌ SEGREDO DETECTADO em: $file${NC}"
      echo -e "${YELLOW}   Padrão: $pattern${NC}"
      echo -e "${YELLOW}   Remova o segredo e use variável de ambiente!${NC}"
      SECRETS_FOUND=1
    fi
  done
done

if [ $SECRETS_FOUND -eq 1 ]; then
  echo ""
  echo -e "${RED}🚫 COMMIT BLOQUEADO — segredos detectados nas linhas adicionadas.${NC}"
  echo "   Solução: use import.meta.env.VITE_* (frontend) ou process.env.* (backend)"
  echo ""
  exit 1
fi

echo "✅ Nenhum segredo detectado — commit autorizado."
exit 0
