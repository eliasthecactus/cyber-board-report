/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "dev" for the /dev/ preview deployment; anything else means production. */
  readonly VITE_APP_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
