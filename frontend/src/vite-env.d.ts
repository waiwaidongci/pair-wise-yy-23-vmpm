/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_LOG_LEVEL?: "debug" | "info" | "warn" | "silent";
  readonly VITE_IDB_NAME?: string;
  readonly VITE_IDB_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
