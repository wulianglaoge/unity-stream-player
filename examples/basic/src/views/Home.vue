<template>
  <div class="home-view">
    <div class="hero">
      <div class="hero-content">
        <div class="badge">Vue 3 组件示例</div>
        <h1>Unity Stream Player</h1>
        <p class="subtitle">
          这是一个演示项目，展示如何使用 <code>unity-stream-player</code> 组件库
        </p>

        <div class="action-buttons">
          <button class="btn primary" @click="goToDemo">
            查看演示
          </button>
          <a
            class="btn secondary"
            href="https://github.com/wulianglaoge/unity-stream-player"
            target="_blank"
          >
            组件文档
          </a>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- 项目关系说明 -->
      <div class="section">
        <h2>项目结构</h2>
        <div class="structure-cards">
          <div class="struct-card lib">
            <div class="struct-header">
              <span class="tag">组件库</span>
              <h3>unity-stream-player</h3>
            </div>
            <p>提供 UnityStreamPlayer 组件，封装 WebRTC 连接、视频渲染和输入控制</p>
            <ul>
              <li>零依赖（仅使用浏览器原生 API）</li>
              <li>支持 WebRTC 连接管理</li>
              <li>内置鼠标/键盘输入同步</li>
              <li>自动重连与错误处理</li>
            </ul>
          </div>

          <div class="struct-arrow">
            <span>依赖</span>
          </div>

          <div class="struct-card example">
            <div class="struct-header">
              <span class="tag green">当前项目</span>
              <h3>examples/basic</h3>
            </div>
            <p>本示例项目，演示如何引入和使用组件库</p>
            <ul>
              <li>Vue 3 + Vite 搭建</li>
              <li>引入组件库并传入配置</li>
              <li>展示组件基本用法</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 使用方式 -->
      <div class="section">
        <h2>使用方式</h2>
        <div class="usage-grid">
          <div class="usage-card">
            <h4>1. 安装组件</h4>
            <pre><code>npm install unity-stream-player</code></pre>
          </div>

          <div class="usage-card">
            <h4>2. 引入使用</h4>
            <pre><code>&lt;script setup&gt;
import { UnityStreamPlayer } from 'unity-stream-player'
import 'unity-stream-player/dist/style.css'
&lt;/script&gt;

&lt;template&gt;
  &lt;UnityStreamPlayer
    signaling-url="ws://localhost:8080"
  /&gt;
&lt;/template&gt;</code></pre>
          </div>
        </div>
      </div>

      <!-- 更多演示 -->
      <div class="section">
        <h2>更多演示</h2>
        <div class="more-demos">
          <div class="demo-card" @click="$router.push('/iframe')">
            <div class="demo-icon">🔲</div>
            <h4>Iframe 嵌入</h4>
            <p>展示如何通过 iframe 嵌入第三方渲染页面，使用 postMessage 跨域通信</p>
            <span class="demo-link">查看演示 →</span>
          </div>
          <div class="demo-card" @click="$router.push('/practice')">
            <div class="demo-icon">🖥️</div>
            <h4>全屏演示</h4>
            <p>全屏实战演示，实时显示视频流统计信息（分辨率、FPS、码率等）</p>
            <span class="demo-link">查看演示 →</span>
          </div>
        </div>
      </div>

      <!-- WebRTC 监控指标说明 -->
      <div class="section">
        <h2>WebRTC 监控指标说明</h2>
        <p class="section-desc">实时音视频质量监控的 8 个关键参数，帮你快速诊断视频流畅度和网络状况</p>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">📐</span>
              <h4>分辨率</h4>
              <span class="metric-tag">Resolution</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">视频画面的像素尺寸（宽×高），决定画面的精细程度</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">就像照片的清晰度，像素越多画面越清楚，720p 适合手机，1080p 以上适合大屏</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">720p 及以上（1280×720）<br>1080p（1920×1080）为佳</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">🎬</span>
              <h4>帧率</h4>
              <span class="metric-tag">FPS</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">每秒显示的画面帧数，决定视频流畅度</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">类似动画翻页速度，翻得越快动作越连贯，低于 30 帧会感觉卡顿</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">≥ 30 FPS（流畅）<br>60 FPS（丝滑）</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">📊</span>
              <h4>接收码率</h4>
              <span class="metric-tag">Bitrate</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">每秒接收的数据量（kbps/Mbps），反映视频压缩程度</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">就像水管的水流量，流量越大画质越好，但太大会卡。高清视频通常需要 2-5 Mbps</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">≥ 2000 kbps（高清）<br>≥ 5000 kbps（超清）</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">📦</span>
              <h4>丢包</h4>
              <span class="metric-tag">Packets Lost</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">传输过程中丢失的数据包数量，导致画面花屏或声音断续</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">像快递丢件，丢了包裹内容就不完整，严重时画面会马赛克或卡死</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">0（理想）<br>&lt; 1%（可接受）</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">〰️</span>
              <h4>抖动</h4>
              <span class="metric-tag">Jitter</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">数据包到达时间的波动程度（毫秒），反映网络稳定性</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">像高速路上的车流，时快时慢就容易堵。抖动大说明网络不稳定，容易卡顿</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">&lt; 30ms（优秀）<br>&lt; 50ms（良好）</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">⏱️</span>
              <h4>往返时延</h4>
              <span class="metric-tag">RTT</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">数据从发送到接收再返回的总时间（毫秒），反映实时性</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">像打乒乓球，球飞过去再回来的时间。超过 200ms 会有明显延迟感，操作不跟手</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">&lt; 100ms（优秀）<br>&lt; 200ms（可接受）</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">🗜️</span>
              <h4>编码格式</h4>
              <span class="metric-tag">Codec</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">视频压缩编码标准（如 H.264、VP8），决定压缩效率</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">像 ZIP 压缩格式，不同格式压缩率不同。H.264 最通用，VP8/VP9 免专利费，H.265 效率最高</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">H.264（通用）<br>VP8/VP9（Web 友好）</p>
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-icon">🗑️</span>
              <h4>丢弃帧数</h4>
              <span class="metric-tag">Dropped</span>
            </div>
            <div class="metric-body">
              <div class="metric-item">
                <span class="label">参数含义</span>
                <p class="value">因设备性能不足或网络拥堵而主动丢弃的视频帧数</p>
              </div>
              <div class="metric-item">
                <span class="label">通俗解读</span>
                <p class="value">像 CPU 忙不过来直接丢掉一些工作，丢得越多画面越卡。持续增加说明设备或网络扛不住了</p>
              </div>
              <div class="metric-item">
                <span class="label">正常范围</span>
                <p class="value good">0 或很少增加<br>持续增加需检查</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 组件特性 -->
      <div class="section">
        <h2>组件特性</h2>
        <div class="feature-grid">
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <h4>即插即用</h4>
            <p>只需传入 WebSocket 信令地址即可使用</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚡</div>
            <h4>原生 WebRTC</h4>
            <p>使用浏览器原生 API，无需额外依赖</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎮</div>
            <h4>输入同步</h4>
            <p>自动同步鼠标、键盘事件到 Unity</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📱</div>
            <h4>响应式</h4>
            <p>自适应容器大小，支持移动端</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToDemo = () => {
  router.push('/demo')
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}

.hero {
  padding: 80px 24px 60px;
  text-align: center;
  background: radial-gradient(ellipse at center top, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
}

.hero-content {
  max-width: 720px;
  margin: 0 auto;
}

.badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 999px;
  font-size: 13px;
  color: #818cf8;
  margin-bottom: 20px;
}

h1 {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 18px;
  color: #94a3b8;
  margin: 0 0 32px;
}

.subtitle code {
  background: rgba(99, 102, 241, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  color: #818cf8;
  font-family: ui-monospace, monospace;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.btn.primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.section {
  margin-top: 60px;
}

.section h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #f1f5f9;
}

/* 项目结构卡片 */
.structure-cards {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.struct-card {
  flex: 1;
  min-width: 280px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
}

.struct-card.lib {
  border-color: rgba(99, 102, 241, 0.3);
}

.struct-card.example {
  border-color: rgba(34, 197, 94, 0.3);
}

.struct-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.struct-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.tag.green {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.struct-card p {
  margin: 0 0 16px;
  color: #94a3b8;
  font-size: 14px;
}

.struct-card ul {
  margin: 0;
  padding-left: 18px;
  color: #cbd5e1;
  font-size: 13px;
}

.struct-card li {
  margin-bottom: 6px;
}

.struct-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
  font-size: 13px;
}

.struct-arrow::before {
  content: '→';
  font-size: 24px;
  color: #475569;
}

@media (max-width: 768px) {
  .struct-arrow::before {
    content: '↓';
  }
}

/* 使用方式 */
.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

@media (max-width: 480px) {
  .usage-grid {
    grid-template-columns: 1fr;
  }
}

.usage-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.usage-card h4 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #f1f5f9;
}

.usage-card pre {
  margin: 0;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  padding: 16px;
  overflow-x: auto;
}

.usage-card code {
  color: #4ade80;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 更多演示 */
.more-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.demo-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.2s;
}

.demo-card:hover {
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

.demo-icon {
  font-size: 36px;
  margin-bottom: 16px;
}

.demo-card h4 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #f1f5f9;
}

.demo-card p {
  margin: 0 0 16px;
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

.demo-link {
  font-size: 14px;
  color: #818cf8;
  font-weight: 500;
}

/* 特性 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.feature-item {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-item h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #f1f5f9;
}

.feature-item p {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}

@media (max-width: 640px) {
  h1 {
    font-size: 36px;
  }

  .hero {
    padding: 60px 20px 40px;
  }

  .more-demos {
    grid-template-columns: 1fr;
  }
}

/* 监控指标样式 */
.section-desc {
  color: #94a3b8;
  font-size: 15px;
  margin: -12px 0 24px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.metric-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.metric-icon {
  font-size: 24px;
}

.metric-header h4 {
  margin: 0;
  font-size: 16px;
  color: #f1f5f9;
  flex: 1;
}

.metric-tag {
  font-size: 12px;
  color: #64748b;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
}

.metric-body {
  padding: 16px 20px;
}

.metric-item {
  margin-bottom: 14px;
}

.metric-item:last-child {
  margin-bottom: 0;
}

.metric-item .label {
  display: block;
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.metric-item .value {
  margin: 0;
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.5;
}

.metric-item .value.good {
  color: #4ade80;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
