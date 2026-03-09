# 📱 BEN ECOSYSTEM IA — App Mobile (Android & iOS)

> Aplicativo React Native / Expo para acesso aos 35 agentes de IA em celular e tablet.  
> **Mauro Monção Advogados Associados** — Parnaíba-PI e Fortaleza-CE

---

## 🏗️ Estrutura do Projeto

```
mobile/
├── App.tsx                     ← Raiz: navegação + providers
├── app.json                    ← Configuração Expo (ícones, permissões)
├── eas.json                    ← Configuração de build EAS
├── babel.config.js             ← Babel com plugin Reanimated
├── src/
│   ├── types/index.ts          ← Tipos TypeScript compartilhados
│   ├── context/
│   │   └── AuthContext.tsx     ← Autenticação com AsyncStorage
│   ├── lib/
│   │   ├── agents.ts           ← Lista completa dos 35 agentes
│   │   ├── api.ts              ← Chamadas à API + retry
│   │   └── storage.ts          ← Persistência de conversas
│   └── screens/
│       ├── LoginScreen.tsx     ← Tela de login
│       ├── WorkspaceScreen.tsx ← Grid de agentes + filtros
│       ├── ChatScreen.tsx      ← Chat completo com agente
│       └── DrawerContent.tsx   ← Sidebar: menu + histórico
└── assets/                     ← Ícones e splash screen
```

---

## 🚀 Formas de Usar

### Opção 1 — Testar AGORA com Expo Go (sem instalar nada)

Ideal para testar no celular sem gerar APK/IPA:

1. Instale o **Expo Go** no celular:
   - [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

2. No computador, execute:
```bash
cd mobile
npm install
npx expo start
```

3. Escaneie o QR code com o Expo Go.

---

### Opção 2 — Gerar APK para Android (via EAS Build — gratuito)

#### Pré-requisitos
- Conta gratuita em [expo.dev](https://expo.dev)
- Node.js 18+
- EAS CLI

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na Expo
eas login

# Entrar na pasta do app
cd mobile

# Instalar dependências
npm install

# Configurar o projeto (só na primeira vez)
eas init --id seu-project-id

# ─── GERAR APK para Android (link direto para download) ───
npm run build:apk
# ou diretamente:
eas build --platform android --profile preview

# Após o build, você recebe um link para baixar o .apk
# Instale direto no Android sem precisar da Play Store!
```

---

### Opção 3 — Build de Produção (Play Store / App Store)

```bash
# Android (.aab para Play Store)
npm run build:android
# eas build --platform android --profile production

# iOS (.ipa para App Store — requer conta Apple Developer $99/ano)
npm run build:ios
# eas build --platform ios --profile production
```

---

## ⚙️ Variáveis de Ambiente

Crie o arquivo `.env` na pasta `mobile/`:

```bash
cp .env.example .env
```

Edite `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=https://ecosystem.mauromoncao.adv.br
EXPO_PUBLIC_AUTH_SENHA_1=suasenha_admin
EXPO_PUBLIC_AUTH_SENHA_2=suasenha_gmail
EXPO_PUBLIC_AUTH_SENHA_3=suasenha_escritorio
EXPO_PUBLIC_AUTH_SENHA_4=suasenha_assistente
```

> **Nota:** As variáveis `EXPO_PUBLIC_*` são incorporadas no bundle em tempo de build.  
> Nunca coloque chaves de API de terceiros com prefixo `EXPO_PUBLIC_`.

---

## 📱 Funcionalidades do App

| Funcionalidade | Status |
|---|---|
| Login com credenciais do escritório | ✅ |
| 35 agentes de IA (Growth + Juris) | ✅ |
| Chat em tempo real com cada agente | ✅ |
| Retry automático em caso de falha | ✅ |
| Histórico persistido localmente | ✅ |
| Busca no histórico | ✅ |
| Favoritar conversas | ✅ |
| Exportar conversa (TXT / Compartilhar) | ✅ |
| Copiar resposta do agente | ✅ |
| Filtros por projeto e categoria | ✅ |
| Status dos sistemas em tempo real | ✅ |
| Modo Timbre Oficial | ✅ |
| Pesquisa web (modo Web) | ✅ |
| Sidebar/Drawer de navegação | ✅ |
| Suporte a tablet (landscape) | ✅ |
| Sessão segura (expiração 8h) | ✅ |
| Perfil Admin com acesso total | ✅ |

---

## 🎨 Assets (Ícones)

Coloque na pasta `assets/`:

| Arquivo | Tamanho | Uso |
|---|---|---|
| `icon.png` | 1024×1024px | Ícone do app (fundo azul `#0f2044`) |
| `splash-icon.png` | 1284×2778px | Splash screen |
| `adaptive-icon.png` | 1024×1024px | Android adaptive icon |
| `favicon.png` | 32×32px | Web |

> Crie ícones usando o logo do escritório (Falcone) com fundo `#0f2044` e dourado `#D4A017`.

---

## 🏪 Publicar nas Lojas

### Google Play Store

1. Crie uma conta de [desenvolvedor Google Play](https://play.google.com/console) (~R$125 taxa única)
2. Gere o build de produção: `npm run build:android`
3. Submeta: `npm run submit:android`

### Apple App Store

1. Crie uma conta [Apple Developer](https://developer.apple.com) (~$99/ano)
2. Configure `eas.json` com seu `appleId` e `ascAppId`
3. Gere o build: `npm run build:ios`
4. Submeta: `npm run submit:ios`

---

## 🔧 Tech Stack

- **React Native 0.83** + **Expo SDK 55**
- **TypeScript** — tipagem completa
- **React Navigation 7** — Stack + Drawer
- **AsyncStorage** — persistência local de conversas e sessão
- **EAS Build** — build na nuvem sem necessidade de Xcode/Android Studio
- **expo-file-system** — exportação de arquivos
- **expo-sharing** — compartilhamento de conversas
- **expo-clipboard** — copiar respostas

---

## 🔗 Arquitetura de API

O app se conecta diretamente à mesma API do web:

```
App Mobile
    └── ecosystem.mauromoncao.adv.br
            ├── /api/agents/run   ← Chat com agentes
            ├── /api/bridge       ← Status dos sistemas
            └── /api/monitor      ← Admin: custos e tokens
```

---

## 🐛 Solução de Problemas

### "Metro bundler não inicia"
```bash
npx expo start --clear
```

### "Erro de SSL em desenvolvimento"
Use HTTPS na `EXPO_PUBLIC_API_BASE_URL`. O app Android bloqueia HTTP em produção.

### "Build falha no EAS"
Verifique se as credenciais Expo estão corretas:
```bash
eas whoami
eas credentials
```

### "App não conecta à API"
Verifique se `ecosystem.mauromoncao.adv.br` está com CORS habilitado para origens mobile.

---

## 📞 Suporte

**Mauro Monção Advogados Associados**  
Parnaíba-PI e Fortaleza-CE  
`ecosystem.mauromoncao.adv.br`

---

© 2026 Mauro Monção Advogados Associados · BEN Ecosystem IA Mobile v1.0
