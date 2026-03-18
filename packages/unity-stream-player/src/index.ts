import UnityStreamPlayer from './index.vue'
import type { App } from 'vue'

export { UnityStreamPlayer }

export default {
  install(app: App) {
    app.component('UnityStreamPlayer', UnityStreamPlayer)
  }
}

// 类型导出
export type UnityStreamPlayerInstance = InstanceType<typeof UnityStreamPlayer>
