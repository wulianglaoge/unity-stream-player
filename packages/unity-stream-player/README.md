# Unity Stream Player

Vue 3 组件，用于 Unity Render Streaming WebRTC 播放器。

## 安装

```bash
npm install @your-scope/unity-stream-player
```

## 使用

```vue
<script setup>
import { UnityStreamPlayer } from '@your-scope/unity-stream-player'
import '@your-scope/unity-stream-player/dist/style.css'
</script>

<template>
  <UnityStreamPlayer signaling-url="ws://localhost:8080" />
</template>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `signalingUrl` | `string` | `""` | WebSocket 信令服务器地址 |
| `autoFullscreen` | `boolean` | `false` | 首帧到来时是否自动全屏 |
| `contentHint` | `string` | `"detail"` | 视频轨道内容提示 |
| `fit` | `string` | `"contain"` | 视频适应模式 |

## License

MIT
