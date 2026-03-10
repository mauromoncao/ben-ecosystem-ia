# BEN Ecosystem IA — Aplicativo Mobile

> **React Native + Expo** para Android e iOS  
> Mauro Monção Advogados Associados — Parnaíba-PI e Fortaleza-CE

---

## 📱 Visão Geral

Aplicativo mobile completo do **BEN ECOSYSTEM IA**, permitindo acesso a todos os **35 agentes de IA** diretamente pelo celular ou tablet (Android e iOS), com a mesma experiência do workspace web.

---

## 🏗️ Estrutura do Projeto

```
mobile/
├── App.tsx                          # Raiz: navegação + providers
├── app.json                         # Configuração Expo
├── eas.json                         # Configuração EAS Build
├── babel.config.js                  # Babel + Reanimated
├── src/
│   ├── types/index.ts               # Tipos TypeScript compartilhados
│   ├── context/
│   │   └── AuthContext.tsx          # Autenticação (login/logout/sessão)
│   ├── lib/
│   │   ├── agents.ts                # Lista dos 35 agentes
│   │   ├── api.ts                   # Integração com API do Ecosystem
│   │   └── storage.ts               # AsyncStorage (conversas + sessão)
│   └── screens/
│       ├── LoginScreen.tsx          # Tela de login
│       ├── WorkspaceScreen.tsx      # Grid de agentes com filtros
│       ├── ChatScreen.tsx           # Chat com cada agente
│       └── DrawerContent.tsx        # Drawer: menu + histórico
└── assets/                          # Ícones e splash screen
```

---

## ⚙️ Pré-requisitos

- **Node.js** 18+ e **npm**
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (para builds): `npm install -g eas-cli`
- Conta gratuita em **[expo.dev](https://expo.dev)**
- Para iOS: macOS + Xcode OU usar EAS Build na nuvem
- Para Android: Android Studio (emulador) OU EAS Build na nuvem

---

## 🚀 Instalação e Execução Local

```bash
# 1. Entre na pasta do app mobile
cd mobile

# 2. Instale as dependências
npm install

# 3. Crie o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env com suas senhas

# 4. Inicie o servidor de desenvolvimento
npm start
# ou diretamente:
npx expo start
```

### Testar no celular (mais fácil)
1. Instale o app **Expo Go** no celular (Play Store / App Store)
2. Escaneie o QR Code exibido no terminal
3. O app abrirá instantaneamente no seu celular

### Testar no emulador Android
```bash
npm run android
# Requer Android Studio instalado
```

### Testar no simulador iOS (apenas macOS)
```bash
npm run ios
# Requer Xcode instalado
```

---

## 📦 Gerar APK / IPA para distribuição

### Usando EAS Build (recomendado — build na nuvem, sem necessidade de Mac/Android Studio)

```bash
# 1. Login na conta Expo
eas login

# 2. Configurar o projeto (primeira vez)
eas build:configure

# 3. Gerar APK para Android (para testes internos)
npm run build:apk
# ou
eas build --platform android --profile preview

# 4. Gerar App Bundle para Google Play Store
npm run build:android
# ou
eas build --platform android --profile production

# 5. Gerar IPA para iOS (App Store / TestFlight)
npm run build:ios
# ou
eas build --platform ios --profile production

# 6. Gerar ambos simultaneamente
npm run build:preview
```

> **💡 O EAS Build compila na nuvem**, sem precisar de Android Studio ou Mac/Xcode instalados na sua máquina.

---

## 📲 Instalar APK diretamente no Android

Após o build concluir:
1. Acesse o link gerado no terminal ou em **[expo.dev/builds](https://expo.dev/builds)**
2. Baixe o arquivo `.apk`
3. No Android: **Configurações → Segurança → Instalar apps desconhecidos** → ative
4. Abra o `.apk` e instale

---

## 🍎 Publicar na App Store (iOS)

```bash
# Após ter o build aprovado:
eas submit --platform ios
```

Requerimentos:
- Conta Apple Developer Program ($99/ano)
- App ID configurado no Apple Developer Portal
- Preencher `eas.json` com `appleId`, `ascAppId` e `appleTeamId`

---

## 🤖 Publicar na Google Play Store

```bash
# Após ter o build (.aab) aprovado:
eas submit --platform android
```

Requerimentos:
- Conta Google Play Developer ($25 único)
- Service Account JSON configurado
- Preencher `eas.json` com `serviceAccountKeyPath`

---

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na pasta `mobile/`:

```env
# URL da API principal
EXPO_PUBLIC_API_BASE_URL=https://ecosystem.mauromoncao.adv.br

# Senhas dos usuários (mesmas do web)
EXPO_PUBLIC_AUTH_SENHA_1=senha_admin
EXPO_PUBLIC_AUTH_SENHA_2=senha_gmail
EXPO_PUBLIC_AUTH_SENHA_3=senha_escritorio
EXPO_PUBLIC_AUTH_SENHA_4=senha_assistente
```

---

## ✨ Funcionalidades do App

| Feature | Status |
|---------|--------|
| Login seguro (8h sessão) | ✅ |
| 35 agentes de IA | ✅ |
| Chat com histórico persistido | ✅ |
| Retry automático em falha | ✅ |
| Filtros por projeto (Growth/Juris) | ✅ |
| Filtros por categoria | ✅ |
| Busca de agentes | ✅ |
| Status dos sistemas (online/offline) | ✅ |
| Histórico de conversas | ✅ |
| Favoritar conversas ⭐ | ✅ |
| Exportar conversa (TXT / Share) | ✅ |
| Copiar resposta | ✅ |
| Modo Web Search | ✅ |
| Modo Timbre Oficial | ✅ |
| Drawer menu lateral | ✅ |
| Permissões Admin | ✅ |
| Suporte tablet | ✅ |
| Dark/Light automático | ✅ |

---

## 🔗 Links Úteis

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction)
- [React Navigation](https://reactnavigation.org)
- [Expo Go App](https://expo.dev/go)

---

© 2026 Mauro Monção Advogados Associados · BEN Ecosystem IA Mobile v1.0
