# Unity Stream Player

Vue 3 开源组件，用于 Unity Render Streaming WebRTC 播放器，具有多种特性。

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
npm install unity-stream-player
# 或
yarn add unity-stream-player
# 或
pnpm add unity-stream-player
```

## 快速开始

> ⚠️ **重要**: 使用时必须导入 CSS 样式文件，否则组件显示会异常。

### 全局注册

```ts
import { createApp } from 'vue'
import UnityStreamPlayerPlugin from 'unity-stream-player'
import 'unity-stream-player/dist/style.css'

const app = createApp(App)
app.use(UnityStreamPlayerPlugin)
```

### 局部注册

```vue
<script setup>
import { UnityStreamPlayer } from 'unity-stream-player'
import 'unity-stream-player/dist/style.css'
</script>

<template>
  <UnityStreamPlayer
    signaling-url="ws://localhost:8080"
    :auto-fullscreen="false"
    content-hint="detail"
    fit="contain"
  />
</template>
```

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

## 事件

组件同时支持通过事件监听：

```vue
<UnityStreamPlayer
  signaling-url="ws://localhost:8080"
  @connect="handleConnect"
  @disconnect="handleDisconnect"
  @error="handleError"
  @status-change="handleStatusChange"
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

## 暴露的方法

通过 `ref` 可以访问以下方法：

```vue
<script setup>
import { ref } from 'vue'
import { UnityStreamPlayer } from 'unity-stream-player'
import 'unity-stream-player/dist/style.css'

const playerRef = ref()

async function getStats() {
  const stats = await playerRef.value?.getDiagnostics()
  console.log(stats)
}

function reconnect() {
  playerRef.value?.reconnect()
}

// 获取当前状态
const currentStatus = playerRef.value?.connectionStatus
</script>

<template>
  <UnityStreamPlayer ref="playerRef" signaling-url="ws://localhost:8080" />
  <button @click="getStats">获取统计信息</button>
  <button @click="reconnect">手动重连</button>
</template>
```

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDiagnostics()` | `Promise<Diagnostics>` | 获取诊断数据 |
| `reconnect()` | `void` | 手动触发重连 |
| `connectionStatus` | `ConnectionStatus` | 当前连接状态（只读） |

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

## 完整示例

```vue
<script setup>
import { ref } from 'vue'
import { UnityStreamPlayer } from 'unity-stream-player'
import 'unity-stream-player/dist/style.css'

const playerRef = ref()

// 连接状态
function handleConnect(connectionId) {
  console.log('连接成功:', connectionId)
}

function handleDisconnect(connectionId, reason) {
  console.log('连接断开:', connectionId, '原因:', reason)
}

function handleError(error) {
  console.error('连接错误:', error)
  // error.type: 'websocket' | 'webrtc' | 'signaling' | 'unknown'
  // error.message: 错误描述
  // error.retryable: 是否可以重试
}

function handleStatusChange(status, prevStatus) {
  console.log(`状态变化: ${prevStatus} -> ${status}`)
}
</script>

<template>
  <UnityStreamPlayer
    ref="playerRef"
    signaling-url="ws://localhost:8080"
    :enable-reconnect="true"
    :max-reconnect-attempts="5"
    :reconnect-interval="2000"
    :show-connected-indicator="true"
    @connect="handleConnect"
    @disconnect="handleDisconnect"
    @error="handleError"
    @status-change="handleStatusChange"
  />
</template>
```

## 快速启动示例项目

示例项目位于 `examples/basic/`，首次启动前需要配置环境变量：

### 1. 复制配置文件

**macOS / Linux:**

```bash
cd examples/basic
cp .env.example .env
```

**Windows:**

```cmd
cd examples\basic
copy .env.example .env
```

### 2. 修改配置

编辑 `.env` 文件，将 `你的IP地址` 替换为实际的 Unity Render Streaming 服务器地址：

```bash
VITE_URS_SERVER_URL=http://192.168.1.100:80
VITE_URS_SIGNAL_URL=ws://192.168.1.100:80
VITE_IFRAME_RENDER_URL=http://192.168.1.100:80/receiver/index.html
```

### 3. 启动开发服务器

返回项目根目录启动：

```bash
cd ../..
pnpm run dev
```

---

## 开发

**所有命令都在项目根目录执行**，无需进入子目录。

### 命令速查表

| 命令 | 作用 | 说明 |
|------|------|------|
| `pnpm install` | 安装所有依赖 | 首次克隆项目后执行一次即可 |
| `pnpm run dev` | 启动开发服务器 | 运行 example 项目，支持热更新 |
| `pnpm run build` | 打包组件 | 输出到 `packages/unity-stream-player/dist/` |
| `pnpm run build:example` | 打包示例 | 输出到 `examples/basic/dist/` |
| `pnpm run build:all` | 打包所有 | 先打包组件，再打包示例 |
| `pnpm run preview` | 预览示例 | 预览生产构建后的示例 |
| `pnpm run clean` | 清理依赖 | 删除所有 `node_modules` 和 lock 文件 |
| `pnpm run reset` | 完全重置 | 清理后重新安装所有依赖 |

### 发布流程

```bash
# 1. 创建变更集（记录本次更新的改动）
pnpm run changeset

# 2. 更新版本号（根据 changeset 自动更新）
pnpm run version-packages

# 3. 构建并发布到 npm
pnpm run release
```


### 开发工作流示例

```bash
# 首次克隆项目
git clone https://github.com/ywulianglaoge/unity-stream-player.git
cd unity-stream-player
pnpm install

# 日常开发（修改组件代码）
pnpm run dev              # 启动调试，修改代码自动热更新

# 发布前验证
pnpm run build            # 打包组件
pnpm run build:example    # 打包示例（可选）

# 正式发布
pnpm run changeset        # 记录变更
pnpm run version-packages # 更新版本
pnpm run release          # 发布到 npm
```

## 目录结构

```
.
├── packages/
│   └── unity-stream-player/    # npm 包源代码
├── examples/
│   └── basic/                  # 示例项目
├── package.json
└── README.md
```

## 许可证

MIT
