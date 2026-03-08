# Ben Ecosystem IA

> Workspace de Inteligência Artificial para Advocacia de Alto Nível  
> **Mauro Monção Advogados Associados** — Parnaíba-PI e Fortaleza-CE

## Visão Geral

Produto independente do **BEN Strategic Intelligence Hub**, integrado aos dois sistemas:
- **Ben Growth Center** (`ben-growth-center.vercel.app`) — 6 agentes Growth
- **Ben Juris Center** (`ben-juris-center.vercel.app`) — 11 agentes Juris

Total: **17 agentes de IA** em um workspace unificado, com chat livre estilo ChatGPT/Genspark.

## Arquitetura

```
hub.mauromoncao.adv.br
    ├── bengrowth.mauromoncao.adv.br  ──→ /ecosystem (link externo)
    ├── juris.mauromoncao.adv.br      ──→ /ecosystem (link externo)
    └── ecosystem.mauromoncao.adv.br  ◄── este projeto
            ├── API: ben-growth-center.vercel.app/api/agents/run  (Growth)
            └── API: ben-juris-center.vercel.app/api/agents/run   (Juris)
```

## Agentes

### Growth Center (GPT-4o / GPT-4o-mini)
| Agente | Função |
|--------|--------|
| 🤖 Dr. Ben Atendimento | Qualificação de leads e triagem |
| 👩‍💼 MARA — Secretária IA | Agenda, notificações, WhatsApp executivo |
| ✍️ Lex Conteúdo | Artigos jurídicos, posts OAB |
| 📊 Lex Campanhas | Análise Meta Ads / Google Ads |
| 📈 Lex Relatório | Relatórios semanais e KPIs |
| 🔍 Lex Monitor | Alertas e saúde do sistema |

### Juris Center (Claude Haiku 4.5 / Perplexity)
| Agente | Função |
|--------|--------|
| ⚖️ Dr. Ben Petições | Peças processuais conforme o caso concreto |
| 📋 Dr. Ben Contratos | Contratos empresariais, NDAs |
| 📜 Dr. Ben Procurações | Ad Judicia, gerais, especiais |
| 🔬 Dr. Ben Análise Processual | Análise estratégica de processos |
| 🔏 Dr. Ben Auditoria | Prazos críticos e conformidade OAB |
| 💰 Dr. Ben Fiscal/Tributário | Planejamento fiscal e teses |
| 👷 Dr. Ben Trabalhista | TST, reclamações e acordos |
| 🏛️ Dr. Ben Previdenciário | INSS, aposentadorias e revisões |
| 🔎 Dr. Ben Pesquisa Jurídica | STF, STJ, TRF, TJPI em tempo real |
| 🛡️ Dr. Ben Compliance/LGPD | Conformidade LGPD |
| 📚 Dr. Ben Produção Intelectual | Pareceres e publicações |

## Deploy

```bash
npm install
npm run build
npx vercel --prod
```

## Variáveis de Ambiente (Vercel)

```
VITE_AUTH_EMAIL_1=admin@mauromoncao.adv.br
VITE_AUTH_SENHA_1=suasenha
VITE_GROWTH_API_URL=https://ben-growth-center.vercel.app
VITE_JURIS_API_URL=https://ben-juris-center.vercel.app
```

## Integração com os Painéis

Para adicionar o botão "Ben Ecosystem IA" nos outros sistemas:

**Ben Growth Center / App.tsx:**
```tsx
{ to: '/ecosystem', icon: Sparkles, label: 'Ben Ecosystem IA' }
// Redireciona para: https://ecosystem.mauromoncao.adv.br
```

**Ben Juris Center / App.tsx:**
```tsx
{ href: 'https://ecosystem.mauromoncao.adv.br', external: true, icon: Sparkles, label: 'Ben Ecosystem IA' }
```

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- lucide-react (ícones)
- react-router-dom v6
- Deploy: Vercel

## URL Final

`ecosystem.mauromoncao.adv.br`

---

© 2026 Mauro Monção Advogados Associados · Ben Ecosystem IA
