/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Required for production builds; optional for local Vite development. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
