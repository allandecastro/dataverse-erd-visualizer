/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATAVERSE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
