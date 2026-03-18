<template>
  <div class="demo-view">
    <div class="panel">
      <div class="panel-header">
        <h2>组件演示</h2>
        <p class="subtitle">
          传入 WebSocket 信令地址，即可连接 Unity Render Streaming
        </p>
      </div>

      <div class="config">
        <label class="field-label">信令服务器地址</label>
        <div class="field-row">
          <input
            v-model="url"
            class="input"
            placeholder="ws://localhost:80"
          />
          <button class="btn secondary" @click="reset">重置</button>
        </div>
        <p class="hint">
          默认地址从环境变量读取，可在 <code>.env</code> 中配置
        </p>

        <!-- 重连配置 -->
        <div class="reconnect-config">
          <label class="checkbox-label">
            <input v-model="enableReconnect" type="checkbox" />
            <span>启用自动重连</span>
          </label>
          <div v-if="enableReconnect" class="reconnect-options">
            <div class="option-row">
              <label>最大重试次数:</label>
              <input v-model.number="maxReconnectAttempts" type="number" min="1" max="10" class="small-input" />
            </div>
            <div class="option-row">
              <label>初始重连间隔(ms):</label>
              <input v-model.number="reconnectInterval" type="number" min="500" step="500" class="small-input" />
            </div>
          </div>
        </div>
      </div>

      <!-- 连接状态显示 -->
      <div class="status-bar">
        <div class="status-item">
          <span class="status-label">连接状态:</span>
          <span class="status-badge" :class="statusClass">{{ statusText }}</span>
        </div>
        <div v-if="connectionId" class="status-item">
          <span class="status-label">连接 ID:</span>
          <span class="status-value">{{ connectionId }}</span>
        </div>
        <div v-if="dataChannelOpen" class="status-item">
          <span class="status-label">DataChannel:</span>
          <span class="status-badge connected">已打开</span>
        </div>
        <div v-if="lastError" class="status-item error">
          <span class="status-label">错误信息:</span>
          <span class="status-value">{{ lastError }}</span>
        </div>
      </div>

      <div class="player-wrapper">
        <UnityStreamPlayer
          ref="playerRef"
          :signaling-url="url"
          :enable-reconnect="enableReconnect"
          :max-reconnect-attempts="maxReconnectAttempts"
          :reconnect-interval="reconnectInterval"
          :show-connected-indicator="true"
          data-channel-label="data"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
          @error="handleError"
          @status-change="handleStatusChange"
          @data-received="handleDataReceived"
          @datachannel-open="handleDataChannelOpen"
          @datachannel-close="handleDataChannelClose"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="btn primary" @click="toggleDiagnostics">
          {{ showDiagnostics ? '隐藏诊断数据' : '显示诊断数据' }}
        </button>
        <button class="btn secondary" @click="manualReconnect">手动重连</button>
      </div>

      <!-- 诊断数据显示 -->
      <div v-if="showDiagnostics" class="diagnostics-panel">
        <div class="diagnostics-title">实时诊断数据</div>
        <div class="diagnostics-grid">
          <div class="row">
            <div class="k">分辨率</div>
            <div class="v">{{ statsText.resolution }}</div>
          </div>
          <div class="row">
            <div class="k">FPS</div>
            <div class="v">{{ statsText.fps }}</div>
          </div>
          <div class="row">
            <div class="k">接收码率</div>
            <div class="v">{{ statsText.bitrate }}</div>
          </div>
          <div class="row">
            <div class="k">丢包</div>
            <div class="v">{{ statsText.packetsLost }}</div>
          </div>
          <div class="row">
            <div class="k">抖动</div>
            <div class="v">{{ statsText.jitter }}</div>
          </div>
          <div class="row">
            <div class="k">RTT</div>
            <div class="v">{{ statsText.rtt }}</div>
          </div>
          <div class="row">
            <div class="k">编码格式</div>
            <div class="v">{{ statsText.codec }}</div>
          </div>
          <div class="row">
            <div class="k">丢弃帧</div>
            <div class="v">{{ statsText.dropped }}</div>
          </div>
        </div>
        <div class="diagnostics-footnote">每 1s 刷新一次（基于 getStats API）</div>
      </div>

      <!-- DataChannel 通信测试 -->
      <div class="datachannel-panel">
        <h4>DataChannel 双向通信测试</h4>
        <div class="datachannel-status">
          <span :class="['channel-status', dataChannelOpen ? 'open' : 'closed']">
            {{ dataChannelOpen ? '已连接' : '未连接' }}
          </span>
        </div>
        <div class="message-area">
          <div class="messages">
            <div v-if="messages.length === 0" class="empty-msg">暂无消息</div>
            <div v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.type">
              <span class="msg-time">{{ msg.time }}</span>
              <span class="msg-type">{{ msg.type === 'sent' ? '发送' : '接收' }}</span>
              <span class="msg-content">{{ msg.content }}</span>
            </div>
          </div>
        </div>
        <div class="input-area">
          <input
            v-model="inputMessage"
            class="message-input"
            placeholder="输入消息发送到 Unity..."
            :disabled="!dataChannelOpen"
            @keyup.enter="sendTextMessage"
          />
          <button class="btn primary" :disabled="!dataChannelOpen || !inputMessage" @click="sendTextMessage">
            发送文本
          </button>
          <button class="btn secondary" :disabled="!dataChannelOpen" @click="sendJsonMessage">
            发送JSON
          </button>
          <button class="btn secondary" :disabled="!dataChannelOpen" @click="sendBinaryMessage">
            发送二进制
          </button>
          <button class="btn secondary" @click="clearMessages">
            清空
          </button>
        </div>
        <p class="hint">
          <strong>注意：</strong>Unity 端需要自行实现 DataChannel 接收器才能处理发送的消息。
          接收到的消息将显示在上方列表中。
        </p>
      </div>

      <div class="tips">
        <p>
          <strong>提示：</strong>
          确保 Unity Render Streaming 已运行，且浏览器允许 WebRTC 连接
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UnityStreamPlayer, type ConnectionStatus, type ConnectionError, type DataChannelMessage } from "unity-stream-player"
import { ref, computed, onBeforeUnmount } from "vue"

const defaultUrl = import.meta.env.VITE_URS_SIGNAL_URL || "ws://localhost:80"
const url = ref(defaultUrl)
const playerRef = ref<InstanceType<typeof UnityStreamPlayer>>()

// 重连配置
const enableReconnect = ref(true)
const maxReconnectAttempts = ref(3)
const reconnectInterval = ref(1000)

// 状态显示
const currentStatus = ref<ConnectionStatus>('idle')
const connectionId = ref('')
const lastError = ref('')

// 诊断数据
const showDiagnostics = ref(false)
const stats = ref<any>(null)
let statsTimer: number | null = null

// DataChannel 状态
const dataChannelOpen = ref(false)
const messages = ref<Array<{type: 'sent' | 'received', content: string, time: string}>>([])
const inputMessage = ref('')

const statusText = computed(() => {
  const map: Record<ConnectionStatus, string> = {
    idle: '未连接',
    connecting: '连接中',
    connected: '已连接',
    reconnecting: '重连中',
    error: '连接失败',
    disconnected: '已断开'
  }
  return map[currentStatus.value]
})

const statusClass = computed(() => {
  const map: Record<ConnectionStatus, string> = {
    idle: 'idle',
    connecting: 'connecting',
    connected: 'connected',
    reconnecting: 'reconnecting',
    error: 'error',
    disconnected: 'disconnected'
  }
  return map[currentStatus.value]
})

const reset = () => {
  url.value = defaultUrl
  lastError.value = ''
  messages.value = []
  inputMessage.value = ''
}

// 诊断数据格式化
function fmtNumber(v: any, digits = 1) {
  if (typeof v !== "number" || Number.isNaN(v)) return "-"
  return v.toFixed(digits)
}

const statsText = computed(() => {
  const s = stats.value || {}
  const w = typeof s.width === "number" ? s.width : null
  const h = typeof s.height === "number" ? s.height : null
  return {
    resolution: w && h ? `${w}×${h}` : "-",
    fps: s.fps != null ? `${fmtNumber(s.fps, 1)}` : "-",
    bitrate: s.bitrateKbps != null ? `${fmtNumber(s.bitrateKbps, 0)} kbps` : "-",
    packetsLost: s.packetsLost != null ? `${fmtNumber(s.packetsLost, 0)}` : "-",
    jitter: s.jitterMs != null ? `${fmtNumber(s.jitterMs, 1)} ms` : "-",
    rtt: s.rttMs != null ? `${fmtNumber(s.rttMs, 1)} ms` : "-",
    codec: s.codec ? s.codec.replace('video/', '') : "-",
    dropped: s.framesDropped != null ? `${fmtNumber(s.framesDropped, 0)}` : "-"
  }
})

// 开始/停止诊断数据刷新
const startDiagnostics = () => {
  if (statsTimer) return
  statsTimer = window.setInterval(async () => {
    const api = playerRef.value
    if (!api?.getDiagnostics) return
    try {
      stats.value = await api.getDiagnostics()
    } catch (_) {
      // ignore
    }
  }, 1000)
}

const stopDiagnostics = () => {
  if (statsTimer) {
    window.clearInterval(statsTimer)
    statsTimer = null
  }
}

const toggleDiagnostics = () => {
  showDiagnostics.value = !showDiagnostics.value
  if (showDiagnostics.value) {
    startDiagnostics()
  } else {
    stopDiagnostics()
  }
}

// 事件处理
const handleConnect = (id: string) => {
  console.log('连接成功:', id)
  connectionId.value = id
  lastError.value = ''
}

const handleDisconnect = (id: string, reason: string) => {
  console.log('连接断开:', id, reason)
  connectionId.value = ''
  dataChannelOpen.value = false
}

const handleError = (error: ConnectionError) => {
  console.error('连接错误:', error)
  lastError.value = error.message
}

const handleStatusChange = (status: ConnectionStatus, prevStatus: ConnectionStatus) => {
  console.log(`状态变化: ${prevStatus} -> ${status}`)
  currentStatus.value = status
}

// DataChannel 事件处理
const handleDataReceived = (message: DataChannelMessage) => {
  console.log('收到数据:', message)
  const content = typeof message.data === 'string'
    ? message.data
    : `二进制数据 (${(message.data as ArrayBuffer).byteLength} bytes)`

  messages.value.push({
    type: 'received',
    content,
    time: new Date(message.timestamp).toLocaleTimeString()
  })
}

const handleDataChannelOpen = (id: string) => {
  console.log('DataChannel 打开:', id)
  dataChannelOpen.value = true
}

const handleDataChannelClose = (id: string) => {
  console.log('DataChannel 关闭:', id)
  dataChannelOpen.value = false
}

// 操作方法
const manualReconnect = () => {
  playerRef.value?.reconnect()
}

// DataChannel 发送方法
const sendTextMessage = () => {
  if (!inputMessage.value.trim()) return

  const success = playerRef.value?.sendData(inputMessage.value)
  if (success) {
    messages.value.push({
      type: 'sent',
      content: inputMessage.value,
      time: new Date().toLocaleTimeString()
    })
    inputMessage.value = ''
  } else {
    alert('发送失败，DataChannel 未就绪')
  }
}

const sendJsonMessage = () => {
  const data = {
    type: 'test',
    action: 'ping',
    timestamp: Date.now(),
    payload: { message: 'Hello from Vue!' }
  }

  const success = playerRef.value?.sendData(data)
  if (success) {
    messages.value.push({
      type: 'sent',
      content: JSON.stringify(data),
      time: new Date().toLocaleTimeString()
    })
  } else {
    alert('发送失败，DataChannel 未就绪')
  }
}

const sendBinaryMessage = () => {
  const buffer = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]) // "Hello"

  const success = playerRef.value?.sendBinaryData(buffer)
  if (success) {
    messages.value.push({
      type: 'sent',
      content: `二进制数据 (${buffer.length} bytes)`,
      time: new Date().toLocaleTimeString()
    })
  } else {
    alert('发送失败，DataChannel 未就绪')
  }
}

const clearMessages = () => {
  messages.value = []
}

onBeforeUnmount(() => {
  stopDiagnostics()
})
</script>

<style scoped>
.demo-view {
  min-height: calc(100vh - 60px);
  padding: 40px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  box-sizing: border-box;
}

.panel {
  width: 100%;
  max-width: 1000px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
}

.panel-header {
  text-align: center;
  margin-bottom: 24px;
}

h2 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #f1f5f9;
}

h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #cbd5e1;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

.config {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #cbd5e1;
  margin-bottom: 8px;
}

.field-row {
  display: flex;
  gap: 12px;
}

.input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #6366f1;
}

.input::placeholder {
  color: #64748b;
}

.hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: #64748b;
}

.hint code {
  background: rgba(99, 102, 241, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  color: #818cf8;
  font-family: ui-monospace, monospace;
}

.reconnect-config {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
}

.reconnect-options {
  margin-top: 12px;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.option-row label {
  min-width: 120px;
}

.small-input {
  width: 80px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #e2e8f0;
  font-size: 13px;
}

.status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-item.error {
  width: 100%;
  color: #fca5a5;
}

.status-label {
  color: #64748b;
}

.status-value {
  color: #e2e8f0;
  font-family: ui-monospace, monospace;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.idle {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.status-badge.connecting {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.status-badge.connected {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-badge.reconnecting {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.status-badge.disconnected {
  background: rgba(100, 116, 139, 0.2);
  color: #64748b;
}

.player-wrapper {
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.btn.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 诊断数据面板 - 与 PracticeDemoView 统一 */
.diagnostics-panel {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.72));
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  padding: 14px 14px 12px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.62),
    0 0 0 1px rgba(15, 23, 42, 0.72);
}

.diagnostics-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(226, 232, 240, 0.95);
  margin-bottom: 10px;
}

.diagnostics-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  align-items: center;
}

.k {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.95);
}

.v {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.diagnostics-footnote {
  margin-top: 10px;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
}

.datachannel-panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.datachannel-status {
  margin-bottom: 12px;
}

.channel-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.channel-status.open {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.channel-status.closed {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.message-area {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-msg {
  text-align: center;
  color: #64748b;
  font-size: 13px;
  padding: 20px;
}

.message-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.message-item.sent {
  border-left: 3px solid #6366f1;
}

.message-item.received {
  border-left: 3px solid #22c55e;
}

.msg-time {
  color: #64748b;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}

.msg-type {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.msg-content {
  color: #e2e8f0;
  word-break: break-all;
  flex: 1;
}

.input-area {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  color: #e2e8f0;
  font-size: 14px;
  outline: none;
}

.message-input:focus {
  border-color: #6366f1;
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tips {
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.tips strong {
  color: #94a3b8;
}

@media (max-width: 640px) {
  .demo-view {
    padding: 20px 16px;
  }

  .panel {
    padding: 20px;
  }

  .field-row,
  .actions,
  .input-area {
    flex-direction: column;
  }

  .btn.secondary,
  .btn.primary {
    width: 100%;
  }

  .status-bar {
    flex-direction: column;
    gap: 8px;
  }

  .diagnostics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
