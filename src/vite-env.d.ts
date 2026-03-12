/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_EMAIL_1: string
  readonly VITE_AUTH_SENHA_1: string
  readonly VITE_AUTH_EMAIL_2: string
  readonly VITE_AUTH_SENHA_2: string
  readonly VITE_JURIS_API_URL: string
  readonly VITE_GROWTH_API_URL: string
  readonly VITE_WORKSPACE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
