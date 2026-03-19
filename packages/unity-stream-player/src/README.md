# Unity Stream Player

基于 WebRTC 的 Unity Render Streaming 视频流播放器 Vue 组件。

## 目录结构

```
UnityStreamPlayer/
├── index.vue                # 主组件（入口）
├── index.js                 # 统一入口，导出所有模块
├── signaling.js             # WebSocket 信令
├── renderstreaming.js       # Render Streaming 核心
├── sender.js                # 输入发送器
├── inputremoting.js         # 输入远程控制
├── inputdevice.js           # 输入设备定义
├── peer.js                  # WebRTC Peer 连接
├── pointercorrect.js        # 指针坐标校正
├── gamepadhandler.js        # 游戏手柄处理
├── memoryhelper.js          # 内存辅助工具
├── logger.js                # 日志工具
├── keymap.js                # 键盘映射
├── mousebutton.js           # 鼠标按钮定义
├── gamepadbutton.js         # 手柄按钮定义
├── touchflags.js            # 触摸标志
├── touchphase.js            # 触摸阶段
└── charnumber.js            # 字符编码
```

## 使用方法

### 1. 拷贝目录

将整个 `UnityStreamPlayer` 目录复制到你的 Vue 项目的 components 目录下。

### 2. 注册组件

**方式一：直接导入（推荐）**

```vue
<script setup>
import UnityStreamPlayer from './components/UnityStreamPlayer/index.vue'
</script>

<template>
  <UnityStreamPlayer :signaling-url="wsUrl" />
</template>
```

**方式二：通过入口文件导入**

```vue
<script setup>
import { UnityStreamPlayer } from './components/UnityStreamPlayer'

const wsUrl = 'ws://localhost:8080/signaling'
</script>

<template>
  <UnityStreamPlayer :signaling-url="wsUrl" />
</template>
```

**方式三：全局注册**

如果你需要在多个页面使用组件，可以在 `main.ts` 中全局注册：

```ts
// main.ts
import UnityStreamPlayer from './components/UnityStreamPlayer'

app.use(UnityStreamPlayer)
```

然后在任意组件中直接使用：

```vue
<template>
  <UnityStreamPlayer :signaling-url="wsUrl" />
</template>

<script setup>
const wsUrl = 'ws://localhost:8080/signaling'
</script>
```

> ⚠️ 注意：全局注册后，在模板中可以直接使用 `<UnityStreamPlayer />`，无需手动导入。

### 3. Props 说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `signalingUrl` | `string` | `''` | WebSocket 信令服务器地址 |

### 4. 完整示例

```vue
<template>
  <div class="stream-container">
    <UnityStreamPlayer :signaling-url="signalingUrl" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UnityStreamPlayer from '@/components/UnityStreamPlayer/index.vue'

const signalingUrl = ref('ws://your-server:8080/signaling')
</script>

<style scoped>
.stream-container {
  width: 100%;
  height: 100vh;
}
</style>
```

## 高级用法

如需自定义底层功能，可直接导入相关类：

```javascript
import {
  WebSocketSignaling,
  RenderStreaming,
  Sender,
  InputRemoting
} from './components/UnityStreamPlayer'
```

## 依赖

- Vue 3.x
- 浏览器支持 WebRTC

## 注意事项

1. 确保信令服务器地址正确且可访问
2. 组件会自动处理连接、重连和清理
3. 支持鼠标、键盘、触摸和手柄输入
4. 组件会在卸载时自动清理资源
