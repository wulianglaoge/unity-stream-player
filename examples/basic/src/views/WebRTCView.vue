<template>
  <div class="web-rtc-view">
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Unity Render Streaming 示例</h2>
          <p class="subtitle">输入 URS WebSocket 地址，即可预览并控制 Unity 画面</p>
        </div>
        <div class="badge">Demo</div>
      </div>

      <div class="panel-body">
        <div class="config">
          <label class="field-label">信令服务器 WebSocket 地址</label>
          <div class="field-row">
            <input
              v-model="url"
              class="input"
              placeholder="例如：ws://127.0.0.1:8080"
            />
            <button class="btn secondary" type="button" @click="reset">
              使用本地默认
            </button>
          </div>
          <p class="hint">
            与 Unity 官方示例一致时，通常为 <code>ws://127.0.0.1:8080</code>。
          </p>
        </div>

        <div class="player-card">
          <UnityStreamPlayer :signaling-url="url" />
        </div>

        <div class="tips">
          <h3>使用说明</h3>
          <ul>
            <li>确保 Unity 项目中已运行 Render Streaming（Broadcast / Receiver 场景）。</li>
            <li>浏览器中不会同时允许多个页面控制同一实例，关闭其它控制页面后再试。</li>
            <li>组件支持鼠标拖拽、滚轮、键盘（如 WASD）等输入，并通过 DataChannel 传回 Unity。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UnityStreamPlayer } from "@your-scope/unity-stream-player"
import { ref } from "vue"

const url = ref(import.meta.env.VITE_URS_SIGNAL_URL)

const reset = () => {
  url.value = import.meta.env.VITE_URS_SIGNAL_URL
}
</script>

<style scoped>
.web-rtc-view {
  min-height: 100vh;
  padding: 32px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top left, #1f2937 0, #020617 45%, #000 100%);
  box-sizing: border-box;
}

.panel {
  width: 100%;
  max-width: 1200px;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 20px;
  padding: 24px 24px 28px;
  box-shadow:
    0 32px 80px rgba(15, 23, 42, 0.8),
    0 0 0 1px rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(18px);
  color: #e5e7eb;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #9ca3af;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #a5b4fc;
  background: radial-gradient(circle at top, rgba(129, 140, 248, 0.16), transparent 70%);
  border: 1px solid rgba(129, 140, 248, 0.4);
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config {
  padding: 14px 16px 18px;
  border-radius: 14px;
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(55, 65, 81, 0.8);
}

.field-label {
  font-size: 13px;
  margin-bottom: 6px;
  color: #d1d5db;
}

.field-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input {
  flex: 1;
  padding: 8px 11px;
  border-radius: 10px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  background: rgba(15, 23, 42, 0.95);
  color: #e5e7eb;
  font-size: 13px;
  outline: none;
}

.input::placeholder {
  color: #6b7280;
}

.input:focus {
  border-color: #6366f1;
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.7),
    0 8px 24px rgba(15, 23, 42, 0.9);
}

.btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease-out;
  white-space: nowrap;
}

.btn.secondary {
  background: rgba(31, 41, 55, 0.95);
  color: #e5e7eb;
  border: 1px solid rgba(75, 85, 99, 0.9);
}

.btn.secondary:hover {
  background: rgba(31, 41, 55, 1);
  border-color: rgba(148, 163, 184, 0.9);
}

.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.hint code {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(55, 65, 81, 0.8);
  font-size: 12px;
}

.player-card {
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(55, 65, 81, 0.9);
  box-shadow:
    0 20px 50px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.9);
}

.player-card :deep(video) {
  display: block;
  width: 100%;
  height: auto;
  max-height: 640px;
}

.tips {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.tips h3 {
  font-size: 13px;
  margin: 0 0 4px;
  color: #e5e7eb;
}

.tips ul {
  margin: 0;
  padding-left: 18px;
}

.tips li + li {
  margin-top: 2px;
}

@media (max-width: 768px) {
  .web-rtc-view {
    padding: 16px 12px 24px;
  }

  .panel {
    padding: 18px 16px 22px;
  }

  .player-card :deep(video) {
    max-height: 260px;
  }
}
</style>