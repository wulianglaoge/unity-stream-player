# Unity Stream Player Vue

Vue 3 组件库，用于 Unity Render Streaming WebRTC 播放器。

## 特性

- 🎮 支持 Unity Render Streaming WebRTC 连接
- 🖱️ 支持鼠标、键盘、触摸、手柄输入
- 📺 自动全屏支持
- 📊 实时性能诊断数据
- 🔧 可配置的适应模式
- 💪 TypeScript 支持

## 安装

```bash
npm install @your-scope/unity-stream-player
# 或
yarn add @your-scope/unity-stream-player
# 或
pnpm add @your-scope/unity-stream-player
```

## 快速开始

### 全局注册

```ts
import { createApp } from 'vue'
import UnityStreamPlayerPlugin from '@your-scope/unity-stream-player'
import '@your-scope/unity-stream-player/dist/style.css'

const app = createApp(App)
app.use(UnityStreamPlayerPlugin)
```

### 局部注册

```vue
<script setup>
import { UnityStreamPlayer } from '@your-scope/unity-stream-player'
import '@your-scope/unity-stream-player/dist/style.css'
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

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `signalingUrl` | `string` | `""` | WebSocket 信令服务器地址 |
| `autoFullscreen` | `boolean` | `false` | 首帧到来时是否自动全屏 |
| `contentHint` | `"detail" \| "text" \| "motion" \| ""` | `"detail"` | 视频轨道内容提示 |
| `fit` | `"contain" \| "cover" \| "fill"` | `"contain"` | 视频适应模式 |

## 暴露的方法

通过 `ref` 可以访问组件方法：

```vue
<script setup>
import { ref } from 'vue'

const playerRef = ref()

async function getStats() {
  const stats = await playerRef.value?.getDiagnostics()
  console.log(stats)
  // {
  //   width: 1920,
  //   height: 1080,
  //   bitrateKbps: 5000,
  //   fps: 60,
  //   packetsLost: 0,
  //   jitterMs: 5,
  //   rttMs: 20,
  //   framesDropped: 0,
  //   codec: "video/VP8",
  //   clockRate: 90000
  // }
}
</script>

<template>
  <UnityStreamPlayer ref="playerRef" signaling-url="ws://localhost:8080" />
  <button @click="getStats">获取统计信息</button>
</template>
```

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

> **注意**: 发布前需要配置 npm 认证信息 (`npm login`)。

### 开发工作流示例

```bash
# 首次克隆项目
git clone <your-repo>
cd webrtc-iframe-vue
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

## 配置说明

### 发布配置

在发布前，请修改以下内容：

1. **包名** (`packages/unity-stream-player/package.json`)
   - 将 `@your-scope/unity-stream-player` 修改为你的实际包名

2. **作者信息**
   - 修改 `author` 字段为你的信息

3. **仓库地址**
   - 更新 `repository.url` 和 `bugs.url` 为你的 GitHub 仓库地址

4. **npm 认证**
   - 运行 `npm login` 登录 npm 账号
   - 如果是私有组织包，需要付费账号

## 许可证

MIT
