import UnityStreamPlayer from './index.vue'
import type { App } from 'vue'
import type { ConnectionStatus, ConnectionError, Diagnostics, DataChannelMessage } from './index.vue'

export { UnityStreamPlayer }
export type { ConnectionStatus, ConnectionError, Diagnostics, DataChannelMessage }

export default {
  install(app: App) {
    app.component('UnityStreamPlayer', UnityStreamPlayer)
  }
}

// 类型导出
export type UnityStreamPlayerInstance = InstanceType<typeof UnityStreamPlayer>
