<template>
  <div ref="playerRef" class="player" :style="playerStyle" @contextmenu.prevent>
    <video
      ref="videoRef"
      class="video"
      autoplay
      playsinline
      muted
    />
    <div v-if="!hasUrl" class="overlay overlay-info">
      <span>未配置信令地址</span>
    </div>
    <div v-else-if="isConnecting" class="overlay overlay-info">
      <span>连接中...</span>
    </div>
    <div v-else-if="hasError" class="overlay overlay-error">
      <span>连接失败，请检查服务端</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick, defineExpose } from "vue"

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

const props = defineProps<{
  /** WebSocket 信令服务器地址 */
  signalingUrl?: string
  /** 首帧到来时是否自动全屏 */
  autoFullscreen?: boolean
  /** 视频轨道内容提示 */
  contentHint?: "" | "detail" | "text" | "motion"
  /** 视频适应模式 */
  fit?: "contain" | "cover" | "fill"
}>()

const autoFullscreen = computed(() => props.autoFullscreen ?? false)
const contentHint = computed(() => props.contentHint ?? "detail")
const fit = computed(() => props.fit ?? "contain")

const playerRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const isConnecting = ref(false)
const hasError = ref(false)
const isFullscreen = ref(false)
const videoAspectRatio = ref<string | null>(null) // string like "16 / 9"

const hasUrl = computed(() => !!props.signalingUrl)

const playerStyle = computed(() => {
  return videoAspectRatio.value ? { aspectRatio: videoAspectRatio.value } : undefined
})

let signaling: any = null
let renderStreaming: any = null
let remoteStream: any = null
let inputRemoting: any = null
let sender: any = null
let inputChannel: any = null
let resizeObserver: any = null
let onWindowResize: any = null
let onFullscreenChange: any = null
let didAutoFullscreen = false
let autoFullscreenAttempted = false
let lastInboundBytes: any = null
let lastInboundTsMs: any = null
let lastFramesDecoded: any = null
let lastFramesTsMs: any = null

onMounted(() => {
  if (hasUrl.value) {
    initConnection()
  }

  onWindowResize = () => {
    // 触发重排以避免某些浏览器全屏/旋转后画面尺寸不同步
    applyVideoLayout()
  }
  window.addEventListener("resize", onWindowResize, { passive: true })

  onFullscreenChange = () => {
    const current = document.fullscreenElement
    isFullscreen.value = !!current && current === playerRef.value
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

    // 先清理旧连接
    await cleanup()
    hasError.value = false

    if (newUrl) {
      initConnection()
    }
  }
)

watch(
  () => props.autoFullscreen,
  async (enabled) => {
    if (!enabled) return
    // 尽量请求一次；浏览器若要求用户手势会拒绝（忽略即可）
    await nextTick()
    await maybeRequestFullscreen()
  }
)

watch(
  () => props.fit,
  () => applyVideoLayout()
)

async function initConnection() {
  try {
    if (!props.signalingUrl) {
      return
    }

    isConnecting.value = true
    hasError.value = false

    // 创建 WebSocket 信令连接
    signaling = new WebSocketSignaling()
    
    // 重写 WebSocket 连接 URL
    signaling.websocket = new WebSocket(props.signalingUrl)
    signaling.websocket.onopen = () => {
      signaling.isWsOpen = true
    }
    signaling.websocket.onclose = () => {
      signaling.isWsOpen = false
    }
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

    // 创建 RenderStreaming 实例
    renderStreaming = new RenderStreaming(signaling, {})

    renderStreaming.onAddChannel = (data: any) => {
      const channel = data.channel
      if (channel && channel.label === "input" && videoRef.value) {
        inputChannel = channel
        setupInputSender(videoRef.value, inputChannel)
      }
    }

    renderStreaming.onConnect = () => {
      try {
        inputChannel = renderStreaming.createDataChannel("input")

        if (videoRef.value && inputChannel) {
          setupInputSender(videoRef.value, inputChannel)
        }
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
          // 提示浏览器优先保证细节清晰度（对桌面/3D 场景通常更合适）
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
        // 首帧到来时尝试触发自动全屏（可能被浏览器策略拒绝）
        if (autoFullscreen.value) {
          maybeRequestFullscreen()
        }
      }
    }

    // 启动 RenderStreaming（内部会等待 WebSocket 打开）
    await renderStreaming.start()
    await renderStreaming.createConnection()
    isConnecting.value = false
  } catch (error) {
    console.error('Error initializing connection:', error)
    hasError.value = true
    isConnecting.value = false
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

  // loadedmetadata 只触发一次，但分辨率可能在 renegotiation 后变化，用 resize 再兜底
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
    // Safari/iOS
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
    // 大多数浏览器会要求用户手势；失败就保持非全屏
    autoFullscreenAttempted = false
  }
}

function applyVideoLayout() {
  const videoEl = videoRef.value
  const containerEl = playerRef.value
  if (!videoEl || !containerEl) return

  // 关键：强制 video 以容器为基准铺满，再用 object-fit 控制画面比例
  videoEl.style.width = "100%"
  videoEl.style.height = "100%"
  videoEl.style.objectFit = fit.value

  // 触发一次 layout flush，避免部分浏览器 resize 后视频渲染区域不更新
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
    // 选当前活跃/有数据的那条
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

  // bitrate (kbps) from bytesReceived delta
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

  // fps from framesDecoded delta (fallback to stats framesPerSecond if present)
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
  // 构建输入发送端（鼠标/键盘/触摸/手柄）
  sender = new Sender(videoElement)
  sender.addMouse()
  sender.addKeyboard()
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0) {
    sender.addTouchscreen()
  }
  sender.addGamepad()

  inputRemoting = new InputRemoting(sender)

  // 将 InputRemoting 绑定到 datachannel
  channel.onopen = async () => {
    // 等待 Unity 端准备好
    await new Promise((resolve) => setTimeout(resolve, 100))
    inputRemoting.startSending()
  }

  inputRemoting.subscribe(new Observer(channel))
}

async function cleanup() {
  if (inputRemoting) {
    inputRemoting.stopSending()
  }
  inputRemoting = null
  sender = null
  inputChannel = null
  didAutoFullscreen = false
  autoFullscreenAttempted = false

  if (renderStreaming) {
    await renderStreaming.stop()
  }
  if (signaling) {
    await signaling.stop()
  }
}

onBeforeUnmount(async () => {
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

defineExpose<{
  getDiagnostics: () => Promise<Diagnostics>
}>({
  getDiagnostics
})
</script>

<style scoped>
.player {
  width: 100%;
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
}

.overlay-info {
  color: #e5e7eb;
  background: linear-gradient(135deg, rgba(31,41,55,0.8), rgba(17,24,39,0.8));
}

.overlay-error {
  color: #fecaca;
  background: linear-gradient(135deg, rgba(127,29,29,0.85), rgba(185,28,28,0.85));
}
</style>
