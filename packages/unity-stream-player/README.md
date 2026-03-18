# Unity Stream Player

Vue 3 组件，用于 Unity Render Streaming WebRTC 播放器。

## 特性

- 🎮 支持 Unity Render Streaming WebRTC 连接
- 🖱️ 支持鼠标、键盘、触摸、手柄输入
- 📺 自动全屏支持
- 📊 实时性能诊断数据
- 🔧 可配置的适应模式
- 🔄 **自动重连机制**
- 📡 **连接状态回调**
- 📨 **双向 DataChannel 通信**
- 💪 TypeScript 支持

## 安装

```bash
npm install @shisan/unity-stream-player
```

## 使用

### 基础用法

```vue
<script setup>
import { UnityStreamPlayer } from '@shisan/unity-stream-player'
import '@shisan/unity-stream-player/dist/style.css'
</script>

<template>
  <UnityStreamPlayer signaling-url="ws://localhost:8080" />
</template>
```

### 带连接状态回调

```vue
<script setup>
import { UnityStreamPlayer } from '@shisan/unity-stream-player'

function handleConnect(connectionId) {
  console.log('连接成功:', connectionId)
}

function handleDisconnect(connectionId, reason) {
  console.log('连接断开:', connectionId, reason)
}

function handleError(error) {
  console.error('连接错误:', error)
}
</script>

<template>
  <UnityStreamPlayer
    signaling-url="ws://localhost:8080"
    :on-connect="handleConnect"
    :on-disconnect="handleDisconnect"
    :on-error="handleError"
  />
</template>
```

### 自动重连配置

```vue
<script setup>
import { UnityStreamPlayer } from '@shisan/unity-stream-player'
</script>

<template>
  <UnityStreamPlayer
    signaling-url="ws://localhost:8080"
    :enable-reconnect="true"
    :max-reconnect-attempts="5"
    :reconnect-interval="2000"
    :reconnect-backoff-multiplier="2"
    :max-reconnect-interval="30000"
  />
</template>
```

### 使用 ref 访问组件方法

```vue
<script setup>
import { ref } from 'vue'
import { UnityStreamPlayer } from '@shisan/unity-stream-player'

const playerRef = ref()

async function getStats() {
  const stats = await playerRef.value?.getDiagnostics()
  console.log(stats)
}

function reconnect() {
  playerRef.value?.reconnect()
}
</script>

<template>
  <UnityStreamPlayer ref="playerRef" signaling-url="ws://localhost:8080" />
  <button @click="getStats">获取统计</button>
  <button @click="reconnect">手动重连</button>
</template>
```

### DataChannel 双向通信

通过 DataChannel 与 Unity 进行双向数据传输：

```vue
<script setup>
import { ref } from 'vue'
import { UnityStreamPlayer } from '@shisan/unity-stream-player'

const playerRef = ref()
const messages = ref([])
const inputMessage = ref('')

// 发送数据到 Unity
function sendMessage() {
  const success = playerRef.value?.sendData({
    type: 'chat',
    content: inputMessage.value,
    timestamp: Date.now()
  })

  if (success) {
    console.log('消息已发送')
    inputMessage.value = ''
  } else {
    console.warn('发送失败，DataChannel 未就绪')
  }
}

// 发送二进制数据
function sendBinaryData() {
  const buffer = new Uint8Array([1, 2, 3, 4, 5])
  playerRef.value?.sendBinaryData(buffer)
}

// 接收 Unity 发来的数据
function handleDataReceived(message) {
  console.log('收到 Unity 数据:', message.data)
  messages.value.push({
    data: message.data,
    time: new Date(message.timestamp).toLocaleTimeString()
  })
}

function handleDataChannelOpen(connectionId) {
  console.log('DataChannel 已打开:', connectionId)
}

function handleDataChannelClose(connectionId) {
  console.log('DataChannel 已关闭:', connectionId)
}
</script>

<template>
  <UnityStreamPlayer
    ref="playerRef"
    signaling-url="ws://localhost:8080"
    data-channel-label="data"
    :on-data-received="handleDataReceived"
    :on-data-channel-open="handleDataChannelOpen"
    :on-data-channel-close="handleDataChannelClose"
  />

  <div class="chat-panel">
    <div class="messages">
      <div v-for="(msg, index) in messages" :key="index">
        {{ msg.time }} - {{ msg.data }}
      </div>
    </div>
    <input v-model="inputMessage" @keyup.enter="sendMessage" />
    <button @click="sendMessage">发送</button>
    <button @click="sendBinaryData">发送二进制</button>
  </div>
</template>
```

**注意**: Unity 端需要自行实现 DataChannel 的消息接收和处理逻辑。请参考 Unity Render Streaming 官方文档配置 DataChannel 接收器。

## Props

### 基础配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `signalingUrl` | `string` | `undefined` | WebSocket 信令服务器地址 |
| `autoFullscreen` | `boolean` | `false` | 首帧到来时是否自动全屏 |
| `contentHint` | `"detail" \| "text" \| "motion" \| ""` | `"detail"` | 视频轨道内容提示 |
| `fit` | `"contain" \| "cover" \| "fill"` | `"contain"` | 视频适应模式 |
| `showConnectedIndicator` | `boolean` | `false` | 连接成功后是否显示指示器 |

### 自动重连配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enableReconnect` | `boolean` | `true` | 是否启用自动重连 |
| `maxReconnectAttempts` | `number` | `3` | 最大重连次数 |
| `reconnectInterval` | `number` | `1000` | 初始重连间隔（毫秒） |
| `reconnectBackoffMultiplier` | `number` | `2` | 重连间隔倍增因子（指数退避） |
| `maxReconnectInterval` | `number` | `30000` | 最大重连间隔（毫秒） |

### 事件回调

| 属性 | 类型 | 说明 |
|------|------|------|
| `onConnect` | `(connectionId: string) => void` | 连接成功回调 |
| `onDisconnect` | `(connectionId: string, reason: string) => void` | 连接断开回调 |
| `onError` | `(error: ConnectionError) => void` | 连接错误回调 |
| `onStatusChange` | `(status: ConnectionStatus, prevStatus: ConnectionStatus) => void` | 状态变化回调 |
| `onDataReceived` | `(message: DataChannelMessage) => void` | 收到 DataChannel 消息回调 |
| `onDataChannelOpen` | `(connectionId: string) => void` | DataChannel 打开回调 |
| `onDataChannelClose` | `(connectionId: string) => void` | DataChannel 关闭回调 |

### DataChannel 配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dataChannelLabel` | `string` | `"data"` | DataChannel 标签名 |

## 事件

组件同时支持通过事件监听：

```vue
<UnityStreamPlayer
  signaling-url="ws://localhost:8080"
  @connect="handleConnect"
  @disconnect="handleDisconnect"
  @error="handleError"
  @status-change="handleStatusChange"
  @data-received="handleDataReceived"
  @datachannel-open="handleDataChannelOpen"
  @datachannel-close="handleDataChannelClose"
/>
```

## 类型定义

### ConnectionStatus

```ts
type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'disconnected'
```

- `idle`: 初始状态，未配置地址
- `connecting`: 正在连接
- `connected`: 已连接
- `reconnecting`: 正在重连
- `error`: 连接错误
- `disconnected`: 已断开（手动断开时）

### ConnectionError

```ts
interface ConnectionError {
  type: 'websocket' | 'webrtc' | 'signaling' | 'unknown'
  message: string
  timestamp: number
  retryable: boolean
}
```

### DataChannelMessage

```ts
interface DataChannelMessage {
  data: string | ArrayBuffer  // 接收到的数据
  timestamp: number           // 接收时间戳
  connectionId: string        // 连接 ID
}
```

## 暴露的方法

通过 `ref` 可以访问以下方法：

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDiagnostics()` | `Promise<Diagnostics>` | 获取诊断数据 |
| `reconnect()` | `void` | 手动触发重连 |
| `connectionStatus` | `ConnectionStatus` | 当前连接状态（只读） |
| `sendData(data)` | `boolean` | 发送文本或 JSON 数据到 Unity |
| `sendBinaryData(data)` | `boolean` | 发送二进制数据到 Unity |

### Diagnostics 接口

```ts
interface Diagnostics {
  width: number | null          // 视频宽度
  height: number | null         // 视频高度
  bitrateKbps: number | null    // 码率（kbps）
  fps: number | null            // 帧率
  packetsLost: number | null    // 丢包数
  jitterMs: number | null       // 抖动（毫秒）
  rttMs: number | null          // 往返延迟（毫秒）
  framesDropped: number | null  // 丢弃帧数
  codec: string | null          // 编解码器
  clockRate: number | null      // 时钟频率
}
```

## License

MIT
