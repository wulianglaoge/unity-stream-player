<template>
  <div class="practice-view">
    <div class="stage" aria-label="practice-demo-stage">
      <UnityStreamPlayer
        ref="playerRef"
        class="player"
        :signaling-url="url"
        fit="contain"
      />

      <button class="back-btn" type="button" @click="goBack">
        返回
      </button>

      <div class="info">
        <button class="info-btn" type="button" @click="toggleInfo">
          视频信息
        </button>

        <div v-if="infoOpen" class="info-panel" role="dialog" aria-label="视频信息面板">
          <div class="info-title">实时统计</div>
          <div class="info-grid">
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
          <div class="info-footnote">每 1s 刷新一次（P2P / getStats）。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { UnityStreamPlayer } from "unity-stream-player"

const url = ref(import.meta.env.VITE_URS_SIGNAL_URL)
const router = useRouter()
const playerRef = ref<any>(null)
const infoOpen = ref(false)
const stats = ref<any>(null)
let statsTimer: number | null = null

const previousOverflow = {
  html: "",
  body: ""
}

onMounted(() => {
  previousOverflow.html = document.documentElement.style.overflow
  previousOverflow.body = document.body.style.overflow
  document.documentElement.style.overflow = "hidden"
  document.body.style.overflow = "hidden"

  statsTimer = window.setInterval(async () => {
    const api = playerRef.value
    if (!api?.getDiagnostics) return
    try {
      stats.value = await api.getDiagnostics()
    } catch (_) {
      // ignore
    }
  }, 1000)
})

onBeforeUnmount(() => {
  document.documentElement.style.overflow = previousOverflow.html
  document.body.style.overflow = previousOverflow.body

  if (statsTimer != null) {
    window.clearInterval(statsTimer)
    statsTimer = null
  }
})

function goBack() {
  router.push("/")
}

function toggleInfo() {
  infoOpen.value = !infoOpen.value
}

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
</script>

<style scoped>
.practice-view {
  position: relative;
  min-height: 200px;
}

.stage {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  background: radial-gradient(circle at top left, #1f2937 0, #020617 45%, #000 100%);
  overflow: hidden;
  z-index: 1000; /* 覆盖 App.vue header/footer */
}

.player {
  width: 100%;
  height: 100%;
}

.back-btn {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: calc(env(safe-area-inset-left, 0px) + 12px);
  z-index: 1001;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: rgba(255, 255, 255, 0.92);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.58));
  backdrop-filter: blur(14px);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(15, 23, 42, 0.6);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.01em;
  transition: transform 0.12s ease-out, border-color 0.12s ease-out;
}

.back-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(165, 180, 252, 0.55);
}

.back-btn:active {
  transform: translateY(0);
}

.info {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  right: calc(env(safe-area-inset-right, 0px) + 12px);
  z-index: 1001;
}

.info-btn {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: rgba(255, 255, 255, 0.92);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.58));
  backdrop-filter: blur(14px);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(15, 23, 42, 0.6);
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.01em;
  transition: transform 0.12s ease-out, border-color 0.12s ease-out;
}

.info-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(165, 180, 252, 0.55);
}

.info-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(360px, calc(100vw - 24px));
  border-radius: 16px;
  padding: 14px 14px 12px;
  color: rgba(255, 255, 255, 0.92);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.72));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.62),
    0 0 0 1px rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(16px);
}

.info-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(226, 232, 240, 0.95);
  margin-bottom: 10px;
}

.info-grid {
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

.info-footnote {
  margin-top: 10px;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.9);
}
</style>

