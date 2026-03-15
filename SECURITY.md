# 🔐 PROTOCOLO DE SEGURANÇA — BEN ECOSYSTEM IA
**Versão:** 1.0 — 2026-03-15  
**Aplicável a:** ben-ecosystem-ia, ben-growth-center, ben-juris-center, blog-painel-admin, solucoes-painel-admin

---

## 🚨 REGRA FUNDAMENTAL

> **NENHUM segredo pode existir em código-fonte commitado no GitHub.**
> Senhas, tokens, API keys e credenciais devem estar SEMPRE em variáveis de ambiente.

---

## ✅ O QUE FAZER

### 1. Variáveis de ambiente — Frontend (Vite/React)
```ts
// ✅ CORRETO — lê do ambiente, sem fallback hardcoded
const token = import.meta.env.VITE_ZAPSIGN_TOKEN

// ❌ ERRADO — expõe o token no código-fonte (e no GitHub)
const token = import.meta.env.VITE_ZAPSIGN_TOKEN || '426e787a-3446-4341-bbd2-2b88e544ad39'
```

### 2. Variáveis de ambiente — Backend (Node.js)
```js
// ✅ CORRETO
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')

// ❌ ERRADO — senha exposta no GitHub
const JWT_SECRET = process.env.JWT_SECRET ?? 'NUNCA_FACA_ISSO'
```

### 3. Scripts VPS (.sh)
```bash
# ✅ CORRETO — lê da variável de ambiente ou pede para preencher
OPENAI_KEY=${OPENAI_API_KEY:-PREENCHER_NO_VPS}

# ❌ ERRADO — chave exposta no script
OPENAI_KEY=sk-proj--QsacKTO10qjv2Y4...
```

### 4. Comentários em código
```ts
// ❌ ERRADO — token nos comentários também é vazamento
// Token: 426e787a-3446-4341-bbd2-2b88e544ad39
// Instance ID: 3EFBA328D48CC11FFCB66237BF5854B6

// ✅ CORRETO
// Token: configurado via VITE_ZAPSIGN_TOKEN (Cloudflare Pages env vars)
```

---

## 📋 ONDE CONFIGURAR OS VALORES REAIS

| Plataforma | Onde configurar | Variáveis |
|---|---|---|
| **Cloudflare Pages** | Dashboard → Project → Settings → Environment Variables | Todos os `VITE_*`, `ANTHROPIC_*`, `OPENAI_*`, etc. |
| **Cloudflare Pages** | Dashboard → Project → Settings → Environment Variables | Mesmos acima |
| **VPS Hostinger** | Console SSH → `nano /opt/[service]/.env` | `DATABASE_URL`, `JWT_SECRET`, etc. |
| **GitHub Secrets** | Repo → Settings → Secrets and Variables | Para CI/CD futuro |

---

## 🛡️ PROTEÇÕES IMPLEMENTADAS

### Git Pre-commit Hook
Instalado em todos os projetos em `.git/hooks/pre-commit`.  
**Bloqueia automaticamente** commits com os seguintes padrões:
- `sk-ant-api*` (Anthropic)
- `sk-proj-*` (OpenAI)
- `pplx-*` (Perplexity)
- `AIzaSy*` (Google)
- `GOCSPX-*` (Google OAuth)
- `pcsk_*` (Pinecone)
- JWT tokens longos (base64)
- `$aact_prod_*` (Asaas)
- `EAAUIUsc*` / `EAAiZBZC*` (Meta)
- Senhas do sistema (`Ben****@Center****`, `BenAdmin****!`, etc.)

### GitHub Push Protection
O GitHub bloqueia automaticamente pushes com chaves detectadas (ativado no repositório).

### .gitignore Robusto
Todos os projetos ignoram:
- `.env`, `.env.*`, `*.env`
- `secrets/`, `credentials/`, `private/`
- `*.pem`, `*.key`, `*.p12`

---

## 🔄 FLUXO SEGURO DE DEPLOY

```
1. Desenvolve localmente (chaves no .env local — nunca commitado)
      ↓
2. git add + git commit → pre-commit hook verifica segredos
      ↓
3. git push → GitHub Push Protection verifica novamente
      ↓
4. Cloudflare Pages faz build com as env vars configuradas no dashboard
      ↓
5. Deploy seguro ✅
```

---

## 🚑 SE UM SEGREDO VAZAR (Protocolo de Emergência)

1. **IMEDIATAMENTE** revogar/regenerar a chave no serviço (Anthropic, OpenAI, etc.)
2. Remover o segredo do histórico git:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch caminho/do/arquivo" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```
3. Configurar nova chave nas variáveis de ambiente das plataformas
4. Verificar logs de acesso das APIs afetadas

---

## 📋 CHECKLIST P�RÉ-COMMIT

- [ ] Nenhum token/senha hardcoded em `.ts`, `.tsx`, `.js`
- [ ] Nenhum token nos comentários de código
- [ ] Nenhum token em scripts `.sh` (usar placeholders)
- [ ] Arquivo `.env` listado no `.gitignore`
- [ ] Variáveis configuradas no painel da plataforma (Cloudflare Pages/Workers)
- [ ] `.env.example` atualizado com os nomes das variáveis (sem valores reais)

---

## 📞 Contato
**Responsável de segurança:** Dr. Mauro Monção  
**Email:** mauromoncaoadv.escritorio@gmail.com  
**Sistema:** BEN Ecosystem IA v6.0
