<template>
  <div ref="playerRef" class="player" :style="playerStyle" @contextmenu.prevent>
    <!-- 未配置地址 -->
    <div v-if="connectionStatus === 'idle' && !hasUrl" class="overlay overlay-info">
      <span>未配置信令地址</span>
    </div>
    <!-- 连接中 -->
    <div v-else-if="connectionStatus === 'connecting'" class="overlay overlay-info">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <span>连接中...</span>
        <span v-if="retryCount > 0" class="retry-hint">第 {{ retryCount }} 次重试</span>
      </div>
    </div>
    <!-- 重连中 -->
    <div v-else-if="connectionStatus === 'reconnecting'" class="overlay overlay-warning">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <span>连接断开，正在重连...</span>
        <span class="retry-hint">第 {{ retryCount }} 次重试 / 最多 {{ maxReconnectAttempts }} 次</span>
      </div>
    </div>
    <!-- 连接失败 -->
    <div v-else-if="connectionStatus === 'error'" class="overlay overlay-error">
      <div class="error-container">
        <span>连接失败</span>
        <span v-if="lastErrorMessage" class="error-detail">{{ lastErrorMessage }}</span>
        <button v-if="enableReconnect" class="retry-btn" @click.stop="manualReconnect">
          点击重试
        </button>
      </div>
    </div>
    <!-- 已连接 -->
    <div v-else-if="connectionStatus === 'connected' && showConnectedIndicator" class="overlay overlay-success">
      <span>已连接</span>
    </div>

    <video
      ref="videoRef"
      class="video"
      autoplay
      playsinline
      muted
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from "vue"

import { WebSocketSignaling } from "./signaling.js"
import { RenderStreaming } from "./renderstreaming.js"
import { Sender, Observer } from "./sender.js"
import { InputRemoting } from "./inputremoting.js"

export interface Diagnostics {
  width: number | null
  height: number | null
  bitrateKbps: number | null
  fps: number | null
  packetsLost: number | null
  jitterMs: number | null
  rttMs: number | null
  framesDropped: number | null
  codec: string | null
  clockRate: number | null
}

/** 连接状态类型 */
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'disconnected'

/** 连接错误类型 */
export interface ConnectionError {
  type: 'websocket' | 'webrtc' | 'signaling' | 'unknown'
  message: string
  timestamp: number
  retryable: boolean
}

/** DataChannel 消息类型 */
export interface DataChannelMessage {
  data: string | ArrayBuffer
  timestamp: number
  connectionId: string
}

const props = defineProps<{
  /** WebSocket 信令服务器地址 */
  signalingUrl?: string
  /** 首帧到来时是否自动全屏 */
  autoFullscreen?: boolean
  /** 视频轨道内容提示 */
  contentHint?: "" | "detail" | "text" | "motion"
  /** 视频适应模式 */
  fit?: "contain" | "cover" | "fill"
  /** 是否启用自动重连 */
  enableReconnect?: boolean
  /** 最大重连次数，默认 3 */
  maxReconnectAttempts?: number
  /** 初始重连间隔(毫秒)，默认 1000 */
  reconnectInterval?: number
  /** 重连间隔倍增因子，默认 2(指数退避) */
  reconnectBackoffMultiplier?: number
  /** 最大重连间隔(毫秒)，默认 30000 */
  maxReconnectInterval?: number
  /** 连接成功后是否显示指示器，默认 false */
  showConnectedIndicator?: boolean
  /** 连接成功回调 */
  onConnect?: (connectionId: string) => void
  /** 连接断开回调 */
  onDisconnect?: (connectionId: string, reason: string) => void
  /** 连接错误回调 */
  onError?: (error: ConnectionError) => void
  /** 连接状态变化回调 */
  onStatusChange?: (status: ConnectionStatus, prevStatus: ConnectionStatus) => void
  /** 收到 DataChannel 消息回调 */
  onDataReceived?: (message: DataChannelMessage) => void
  /** DataChannel 打开回调 */
  onDataChannelOpen?: (connectionId: string) => void
  /** DataChannel 关闭回调 */
  onDataChannelClose?: (connectionId: string) => void
  /** DataChannel 标签名，默认 'data' */
  dataChannelLabel?: string
}>()

const emit = defineEmits<{
  connect: [connectionId: string]
  disconnect: [connectionId: string, reason: string]
  error: [error: ConnectionError]
  'status-change': [status: ConnectionStatus, prevStatus: ConnectionStatus]
  'data-received': [message: DataChannelMessage]
  'datachannel-open': [connectionId: string]
  'datachannel-close': [connectionId: string]
}>()

const autoFullscreen = computed(() => props.autoFullscreen ?? false)
const contentHint = computed(() => props.contentHint ?? "detail")
const fit = computed(() => props.fit ?? "contain")
const enableReconnect = computed(() => props.enableReconnect ?? true)
const maxReconnectAttempts = computed(() => props.maxReconnectAttempts ?? 3)
const reconnectInterval = computed(() => props.reconnectInterval ?? 1000)
const reconnectBackoffMultiplier = computed(() => props.reconnectBackoffMultiplier ?? 2)
const maxReconnectInterval = computed(() => props.maxReconnectInterval ?? 30000)
const showConnectedIndicator = computed(() => props.showConnectedIndicator ?? false)

const playerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const connectionStatus = ref<ConnectionStatus>('idle')
const videoAspectRatio = ref<string | null>(null)
const retryCount = ref(0)
const lastErrorMessage = ref('')
const connectionId = ref('')

const hasUrl = computed(() => !!props.signalingUrl)

const playerStyle = computed(() => {
  return videoAspectRatio.value ? { aspectRatio: videoAspectRatio.value } : undefined
})

// 重连相关
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let isManualDisconnect = false

// 组件内部状态
let signaling: any = null
let renderStreaming: any = null
let remoteStream: any = null
let inputRemoting: any = null
let sender: any = null
let inputChannel: any = null
let dataChannel: any = null
let resizeObserver: any = null
let onWindowResize: any = null
let onFullscreenChange: any = null
let didAutoFullscreen = false
let autoFullscreenAttempted = false
let lastInboundBytes: any = null
let lastInboundTsMs: any = null
let lastFramesDecoded: any = null
let lastFramesTsMs: any = null

function updateStatus(newStatus: ConnectionStatus) {
  const prevStatus = connectionStatus.value
  if (prevStatus !== newStatus) {
    connectionStatus.value = newStatus
    props.onStatusChange?.(newStatus, prevStatus)
    emit('status-change', newStatus, prevStatus)
  }
}

function createError(type: ConnectionError['type'], message: string, retryable = true): ConnectionError {
  return {
    type,
    message,
    timestamp: Date.now(),
    retryable
  }
}

function reportError(error: ConnectionError) {
  lastErrorMessage.value = error.message
  props.onError?.(error)
  emit('error', error)
}

onMounted(() => {
  if (hasUrl.value) {
    initConnection()
  }

  onWindowResize = () => {
    applyVideoLayout()
  }
  window.addEventListener("resize", onWindowResize, { passive: true })

  onFullscreenChange = () => {
    applyVideoLayout()
  }
  document.addEventListener("fullscreenchange", onFullscreenChange, { passive: true })

  if (playerRef.value && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => applyVideoLayout())
    resizeObserver.observe(playerRef.value)
  }
})

watch(
  () => props.signalingUrl,
  async (newUrl, oldUrl) => {
    if (newUrl === oldUrl) return

    // 清除重连计时器
    clearReconnectTimer()
    reconnectAttempts = 0
    retryCount.value = 0
    isManualDisconnect = false

    await cleanup()
    lastErrorMessage.value = ''

    if (newUrl) {
      initConnection()
    } else {
      updateStatus('idle')
    }
  }
)

watch(
  () => props.autoFullscreen,
  async (enabled) => {
    if (!enabled) return
    await nextTick()
    await maybeRequestFullscreen()
  }
)

watch(
  () => props.fit,
  () => applyVideoLayout()
)

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function scheduleReconnect() {
  if (!enableReconnect.value) return
  if (isManualDisconnect) return
  if (reconnectAttempts >= maxReconnectAttempts.value) {
    updateStatus('error')
    reportError(createError('websocket', '重连次数已达上限，请检查网络或服务端状态', false))
    return
  }

  reconnectAttempts++
  retryCount.value = reconnectAttempts
  updateStatus('reconnecting')

  // 计算退避间隔
  const interval = Math.min(
    reconnectInterval.value * Math.pow(reconnectBackoffMultiplier.value, reconnectAttempts - 1),
    maxReconnectInterval.value
  )

  reconnectTimer = setTimeout(() => {
    if (!isManualDisconnect && props.signalingUrl) {
      initConnection()
    }
  }, interval)
}

async function manualReconnect() {
  clearReconnectTimer()
  reconnectAttempts = 0
  retryCount.value = 0
  isManualDisconnect = false
  lastErrorMessage.value = ''
  await cleanup()
  await initConnection()
}

async function initConnection() {
  try {
    if (!props.signalingUrl) {
      return
    }

    updateStatus('connecting')
    isManualDisconnect = false

    // 创建 WebSocket 信令连接
    signaling = new WebSocketSignaling()

    // 等待 WebSocket 连接结果
    await new Promise<void>((resolve, reject) => {
      signaling.websocket = new WebSocket(props.signalingUrl!)

      signaling.websocket.onopen = () => {
        signaling.isWsOpen = true
        resolve()
      }

      signaling.websocket.onclose = (event: CloseEvent) => {
        signaling.isWsOpen = false
        const reason = event.wasClean ? '连接正常关闭' : '连接异常断开'
        reject(new Error(`WebSocket ${reason}`))
      }

      signaling.websocket.onerror = () => {
        reject(new Error('WebSocket connection error'))
      }
    })

    // 连接成功后再设置消息处理
    signaling.websocket.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data)
      if (!msg || !signaling) {
        return
      }

      switch (msg.type) {
        case "connect":
          signaling.dispatchEvent(new CustomEvent('connect', { detail: msg }))
          break
        case "disconnect":
          signaling.dispatchEvent(new CustomEvent('disconnect', { detail: msg }))
          break
        case "offer":
          signaling.dispatchEvent(new CustomEvent('offer', { detail: { connectionId: msg.from, sdp: msg.data.sdp, polite: msg.data.polite } }))
          break
        case "answer":
          signaling.dispatchEvent(new CustomEvent('answer', { detail: { connectionId: msg.from, sdp: msg.data.sdp } }))
          break
        case "candidate":
          signaling.dispatchEvent(new CustomEvent('candidate', { detail: { connectionId: msg.from, candidate: msg.data.candidate, sdpMLineIndex: msg.data.sdpMLineIndex, sdpMid: msg.data.sdpMid } }))
          break
        default:
          break
      }
    }

    // WebSocket 断开处理（用于重连）
    signaling.websocket.onclose = () => {
      signaling.isWsOpen = false
      if (!isManualDisconnect && connectionStatus.value !== 'error') {
        const currentConnectionId = connectionId.value
        connectionId.value = ''

        // 触发 DataChannel 关闭事件
        if (dataChannel) {
          dataChannel = null
          props.onDataChannelClose?.(currentConnectionId)
          emit('datachannel-close', currentConnectionId)
        }

        props.onDisconnect?.(currentConnectionId, 'websocket_closed')
        emit('disconnect', currentConnectionId, 'websocket_closed')
        scheduleReconnect()
      }
    }

    // 创建 RenderStreaming 实例
    renderStreaming = new RenderStreaming(signaling, {})

    renderStreaming.onAddChannel = (data: any) => {
      const channel = data.channel
      if (!channel) return

      if (channel.label === "input" && videoRef.value) {
        inputChannel = channel
        setupInputSender(videoRef.value, inputChannel)
      } else if (channel.label === (props.dataChannelLabel || 'data')) {
        dataChannel = channel
        setupDataChannel(dataChannel)
      }
    }

    renderStreaming.onConnect = () => {
      try {
        // 创建输入通道（用于鼠标/键盘等输入）
        inputChannel = renderStreaming.createDataChannel("input")

        if (videoRef.value && inputChannel) {
          setupInputSender(videoRef.value, inputChannel)
        }

        // 创建通用数据通道（用于双向通信）
        const channelLabel = props.dataChannelLabel || 'data'
        dataChannel = renderStreaming.createDataChannel(channelLabel)
        setupDataChannel(dataChannel)
      } catch (error) {
        console.warn("Failed to setup onConnect handlers:", error)
      }
    }

    // 处理轨道事件，将远端轨道挂到 <video> 上
    renderStreaming.onTrackEvent = (data: any) => {
      if (!remoteStream) {
        remoteStream = new MediaStream()
      }

      if (data.track) {
        try {
          if (typeof contentHint.value === "string" && "contentHint" in data.track) {
            data.track.contentHint = contentHint.value
          }
          remoteStream.addTrack(data.track)
        } catch (error) {
          console.warn('Failed to add track to stream:', error)
        }
      }

      if (videoRef.value && remoteStream.getTracks().length > 0) {
        videoRef.value.srcObject = remoteStream
        bindVideoMetadataListeners(videoRef.value)
        applyVideoLayout()
        if (autoFullscreen.value) {
          maybeRequestFullscreen()
        }
      }
    }

    // 启动 RenderStreaming
    await renderStreaming.start()
    const connResult = await renderStreaming.createConnection()
    connectionId.value = connResult?.connectionId || ''

    // 连接成功，重置重连计数
    reconnectAttempts = 0
    retryCount.value = 0
    lastErrorMessage.value = ''
    updateStatus('connected')

    // 触发连接成功回调
    props.onConnect?.(connectionId.value)
    emit('connect', connectionId.value)

  } catch (error: any) {
    console.error('Error initializing connection:', error)

    const errorMessage = error?.message || '未知错误'
    const isRetryable = errorMessage.includes('WebSocket') || errorMessage.includes('连接')

    reportError(createError(
      errorMessage.includes('WebSocket') ? 'websocket' : 'webrtc',
      errorMessage,
      isRetryable
    ))

    updateStatus('error')

    // 尝试重连
    if (isRetryable && enableReconnect.value) {
      scheduleReconnect()
    }
  }
}

function bindVideoMetadataListeners(videoEl: HTMLVideoElement) {
  if (!videoEl) return

  const updateAspect = () => {
    const w = videoEl.videoWidth
    const h = videoEl.videoHeight
    if (w && h) {
      videoAspectRatio.value = `${w} / ${h}`
    }
  }

  videoEl.onloadedmetadata = () => {
    updateAspect()
    applyVideoLayout()
  }
  if ("onresize" in videoEl) {
    videoEl.onresize = () => {
      updateAspect()
      applyVideoLayout()
    }
  }
}

async function maybeRequestFullscreen() {
  if (didAutoFullscreen) return
  if (autoFullscreenAttempted) return
  const el = playerRef.value
  if (!el) return
  if (!autoFullscreen.value) return
  if (document.fullscreenElement) return

  const canFullscreen =
    (typeof document.fullscreenEnabled === "boolean" ? document.fullscreenEnabled : true) ||
    typeof (el as any).webkitRequestFullscreen === "function"
  if (!canFullscreen) return

  try {
    autoFullscreenAttempted = true
    if (typeof el.requestFullscreen === "function") {
      await el.requestFullscreen()
    } else if (typeof (el as any).webkitRequestFullscreen === "function") {
      (el as any).webkitRequestFullscreen()
    }
    didAutoFullscreen = true
  } catch (_) {
    autoFullscreenAttempted = false
  }
}

function applyVideoLayout() {
  const videoEl = videoRef.value
  const containerEl = playerRef.value
  if (!videoEl || !containerEl) return

  videoEl.style.width = "100%"
  videoEl.style.height = "100%"
  videoEl.style.objectFit = fit.value

  // eslint-disable-next-line no-unused-expressions
  containerEl.offsetHeight
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function findSelectedCandidatePair(report: any): any {
  let selectedPair = null
  report?.forEach?.((stat: any) => {
    if (stat.type === "candidate-pair" && (stat.selected || stat.nominated)) {
      selectedPair = stat
    }
  })
  return selectedPair
}

function findInboundVideoRtp(report: any): any {
  let inbound: any = null
  report?.forEach?.((stat: any) => {
    if (stat.type !== "inbound-rtp") return
    const kind = stat.kind || stat.mediaType
    if (kind !== "video") return
    if (!inbound) inbound = stat
    const bytes = toNumber(stat.bytesReceived)
    const inboundBytes = toNumber(inbound.bytesReceived)
    if (bytes != null && (inboundBytes == null || bytes > inboundBytes)) {
      inbound = stat
    }
  })
  return inbound
}

function findCodec(report: any, codecId: string): any {
  if (!codecId) return null
  let codec = null
  report?.forEach?.((stat: any) => {
    if (stat.id === codecId && stat.type === "codec") codec = stat
  })
  return codec
}

async function getDiagnostics(): Promise<Diagnostics> {
  const videoEl = videoRef.value
  const width = videoEl?.videoWidth || null
  const height = videoEl?.videoHeight || null

  let report = null
  try {
    report = await renderStreaming?.getStats?.()
  } catch (_) {
    // ignore
  }

  const inbound = report ? findInboundVideoRtp(report) : null
  const codec = report && inbound?.codecId ? findCodec(report, inbound.codecId) : null
  const selectedPair = report ? findSelectedCandidatePair(report) : null

  const nowMs = performance.now()

  let bitrateKbps = null
  const bytesReceived = inbound ? toNumber(inbound.bytesReceived) : null
  if (bytesReceived != null) {
    if (lastInboundBytes != null && lastInboundTsMs != null) {
      const dt = (nowMs - lastInboundTsMs) / 1000
      if (dt > 0.2) {
        const dBytes = bytesReceived - lastInboundBytes
        if (dBytes >= 0) {
          bitrateKbps = (dBytes * 8) / 1000 / dt
        }
      }
    }
    lastInboundBytes = bytesReceived
    lastInboundTsMs = nowMs
  }

  let fps = inbound ? toNumber(inbound.framesPerSecond) : null
  const framesDecoded = inbound ? toNumber(inbound.framesDecoded) : null
  if (fps == null && framesDecoded != null) {
    if (lastFramesDecoded != null && lastFramesTsMs != null) {
      const dt = (nowMs - lastFramesTsMs) / 1000
      if (dt > 0.2) {
        const dFrames = framesDecoded - lastFramesDecoded
        if (dFrames >= 0) {
          fps = dFrames / dt
        }
      }
    }
    lastFramesDecoded = framesDecoded
    lastFramesTsMs = nowMs
  }

  const packetsLost = inbound ? toNumber(inbound.packetsLost) : null
  const jitterSec = inbound ? toNumber(inbound.jitter) : null
  const jitterMs = jitterSec != null ? jitterSec * 1000 : null
  const framesDropped = inbound ? toNumber(inbound.framesDropped) : null
  const rttSec = selectedPair ? toNumber(selectedPair.currentRoundTripTime) : null
  const rttMs = rttSec != null ? rttSec * 1000 : null

  const codecMimeType = codec?.mimeType || null
  const clockRate = codec ? toNumber(codec.clockRate) : null

  return {
    width,
    height,
    bitrateKbps,
    fps,
    packetsLost,
    jitterMs,
    rttMs,
    framesDropped,
    codec: codecMimeType,
    clockRate
  }
}

function setupInputSender(videoElement: HTMLVideoElement, channel: RTCDataChannel) {
  sender = new Sender(videoElement)
  sender.addMouse()
  sender.addKeyboard()
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0) {
    sender.addTouchscreen()
  }
  sender.addGamepad()

  inputRemoting = new InputRemoting(sender)

  channel.onopen = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    inputRemoting.startSending()
  }

  inputRemoting.subscribe(new Observer(channel))
}

function setupDataChannel(channel: RTCDataChannel) {
  channel.onopen = () => {
    console.log(`DataChannel '${channel.label}' opened`)
    props.onDataChannelOpen?.(connectionId.value)
    emit('datachannel-open', connectionId.value)
  }

  channel.onclose = () => {
    console.log(`DataChannel '${channel.label}' closed`)
    props.onDataChannelClose?.(connectionId.value)
    emit('datachannel-close', connectionId.value)
  }

  channel.onmessage = (event: MessageEvent) => {
    const message: DataChannelMessage = {
      data: event.data,
      timestamp: Date.now(),
      connectionId: connectionId.value
    }
    props.onDataReceived?.(message)
    emit('data-received', message)
  }

  channel.onerror = (error: Event) => {
    console.error(`DataChannel '${channel.label}' error:`, error)
  }
}

function sendData(data: string | object): boolean {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.warn('DataChannel is not ready, cannot send data')
    return false
  }

  try {
    const payload = typeof data === 'string' ? data : JSON.stringify(data)
    dataChannel.send(payload)
    return true
  } catch (error) {
    console.error('Failed to send data:', error)
    return false
  }
}

function sendBinaryData(data: ArrayBuffer | Uint8Array): boolean {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.warn('DataChannel is not ready, cannot send binary data')
    return false
  }

  try {
    dataChannel.send(data)
    return true
  } catch (error) {
    console.error('Failed to send binary data:', error)
    return false
  }
}

async function cleanup() {
  clearReconnectTimer()

  if (inputRemoting) {
    inputRemoting.stopSending()
  }
  inputRemoting = null
  sender = null
  inputChannel = null

  // 触发 DataChannel 关闭事件
  if (dataChannel) {
    const currentConnectionId = connectionId.value
    dataChannel = null
    props.onDataChannelClose?.(currentConnectionId)
    emit('datachannel-close', currentConnectionId)
  }

  didAutoFullscreen = false
  autoFullscreenAttempted = false

  if (renderStreaming) {
    await renderStreaming.stop()
  }
  if (signaling) {
    await signaling.stop()
  }
  signaling = null
  renderStreaming = null
  remoteStream = null
}

onBeforeUnmount(async () => {
  isManualDisconnect = true
  clearReconnectTimer()

  if (resizeObserver && playerRef.value) {
    resizeObserver.disconnect()
  }
  resizeObserver = null

  if (onWindowResize) {
    window.removeEventListener("resize", onWindowResize)
  }
  onWindowResize = null

  if (onFullscreenChange) {
    document.removeEventListener("fullscreenchange", onFullscreenChange)
  }
  onFullscreenChange = null

  await cleanup()
})

defineExpose({
  getDiagnostics,
  reconnect: manualReconnect,
  connectionStatus,
  sendData,
  sendBinaryData
})
</script>

<style scoped>
.player {
  width: 100%;
  min-height: 200px;
  background: black;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
}

.player:fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  box-shadow: none;
}

.video {
  display: block;
  width: 100%;
  height: 100%;
  background: black;
  position: relative;
  z-index: 1;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  pointer-events: none;
  backdrop-filter: blur(6px);
  z-index: 10;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-hint {
  font-size: 12px;
  opacity: 0.8;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.error-detail {
  font-size: 12px;
  opacity: 0.8;
  max-width: 80%;
  text-align: center;
  word-break: break-word;
}

.retry-btn {
  pointer-events: auto;
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.overlay-info {
  color: #e5e7eb;
  background: linear-gradient(135deg, rgba(31,41,55,0.8), rgba(17,24,39,0.8));
}

.overlay-warning {
  color: #fef3c7;
  background: linear-gradient(135deg, rgba(146, 64, 14, 0.85), rgba(180, 83, 9, 0.85));
}

.overlay-error {
  color: #fecaca;
  background: linear-gradient(135deg, rgba(127,29,29,0.85), rgba(185,28,28,0.85));
}

.overlay-success {
  color: #e5e7eb;
  background: rgba(0, 0, 0, 0.6);
  animation: fadeOut 2s forwards;
  animation-delay: 1s;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
