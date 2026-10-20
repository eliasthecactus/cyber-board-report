/// <reference types="vite/client" />

/** The "version" from package.json, injected at build time (vite.config.ts). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** "dev" for the /dev/ preview deployment; anything else means production. */
  readonly VITE_APP_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
