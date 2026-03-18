/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_URS_SERVER_URL: string
  readonly VITE_URS_SIGNAL_URL: string
  readonly VITE_DEFAULT_ROOM_ID: string
  readonly VITE_DEFAULT_AUTH_TOKEN: string
  readonly VITE_IFRAME_RENDER_URL: string
  readonly VITE_DEV_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
