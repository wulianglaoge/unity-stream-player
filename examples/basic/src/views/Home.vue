<template>
  <div class="home-view">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="intro-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h2>Unity 实时渲染流技术方案对比</h2>
              <p class="subtitle">WebRTC 原生方案 vs Iframe 嵌入方案</p>
            </div>
          </template>

          <div class="tech-comparison">
            <el-table
              :data="comparisonData"
              style="width: 100%"
              :header-cell-style="{ background: '#f5f7fa', color: '#303133' }"
              border
            >
              <el-table-column prop="feature" label="对比维度" width="180" fixed>
                <template #default="{ row }">
                  <div class="feature-cell">
                    <el-icon v-if="row.icon" :size="18" class="feature-icon">
                      <component :is="row.icon" />
                    </el-icon>
                    <span class="feature-name">{{ row.feature }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="WebRTC 方案" min-width="350">
                <template #default="{ row }">
                  <div class="webrtc-cell">
                    <el-tag v-if="row.webrtcTag" :type="row.webrtcTagType" size="small" class="cell-tag">
                      {{ row.webrtcTag }}
                    </el-tag>
                    <p class="cell-content">{{ row.webrtc }}</p>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="Iframe 方案" min-width="350">
                <template #default="{ row }">
                  <div class="iframe-cell">
                    <el-tag v-if="row.iframeTag" :type="row.iframeTagType" size="small" class="cell-tag">
                      {{ row.iframeTag }}
                    </el-tag>
                    <p class="cell-content">{{ row.iframe }}</p>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="action-buttons">
            <el-button type="primary" size="large" @click="$router.push('/webrtc')">
              <el-icon><Connection /></el-icon>
              体验 WebRTC 方案
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/iframe')">
              <el-icon><Monitor /></el-icon>
              体验 Iframe 方案
            </el-button>
            <el-button type="warning" size="large" @click="$router.push('/practice')">
              <el-icon><VideoCamera /></el-icon>
              实战演示（全屏）
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="feature-cards">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="feature-card webrtc-feature" shadow="hover" @click="$router.push('/webrtc')">
          <el-icon class="feature-icon-large" color="#409eff"><Connection /></el-icon>
          <h3>WebRTC 方案</h3>
          <ul>
            <li>使用 @unity/render-streaming SDK</li>
            <li>原生 WebRTC 数据传输</li>
            <li>低延迟实时渲染</li>
            <li>需要 URS 项目对接</li>
          </ul>
          <el-button type="primary" plain>立即体验</el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="feature-card iframe-feature" shadow="hover" @click="$router.push('/iframe')">
          <el-icon class="feature-icon-large" color="#67c23a"><Monitor /></el-icon>
          <h3>Iframe 方案</h3>
          <ul>
            <li>嵌入第三方渲染页面</li>
            <li>postMessage 跨域通信</li>
            <li>无需 SDK 依赖</li>
            <li>无需 URS 对接</li>
          </ul>
          <el-button type="success" plain>立即体验</el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="feature-card doc-feature" shadow="hover">
          <el-icon class="feature-icon-large" color="#e6a23c"><Document /></el-icon>
          <h3>使用文档</h3>
          <ul>
            <li>Vite + Vue3 快速搭建</li>
            <li>URS 项目配置指南</li>
            <li>API 接口说明</li>
            <li>常见问题排查</li>
          </ul>
          <el-button type="warning" plain @click="showDocDialog = true">查看文档</el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="feature-card practice-feature" shadow="hover" @click="$router.push('/practice')">
          <el-icon class="feature-icon-large" color="#e6a23c"><VideoCamera /></el-icon>
          <h3>实战演示</h3>
          <ul>
            <li>进入页面后自动尝试全屏</li>
            <li>窗口缩放/旋转保持画面比例</li>
            <li>若浏览器拦截全屏，可一键重试</li>
            <li>适合现场演示与沉浸式体验</li>
          </ul>
          <el-button type="warning" plain>立即体验</el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- 文档弹窗 -->
    <el-dialog v-model="showDocDialog" title="使用文档" width="70%">
      <div class="doc-content">
        <h4>快速开始</h4>
        <ol>
          <li>复制 <code>.env.example</code> 为 <code>.env</code></li>
          <li>配置 URS 服务器地址和授权信息</li>
          <li>运行 <code>npm run dev</code> 启动项目</li>
          <li>访问 <code>http://localhost:3000</code></li>
        </ol>

        <h4>URS 对接配置</h4>
        <p>WebRTC 方案需要正确配置 URS（Unity Render Streaming）服务器信息：</p>
        <ul>
          <li><strong>VITE_URS_SERVER_URL</strong>: URS HTTP API 地址</li>
          <li><strong>VITE_URS_SIGNAL_URL</strong>: WebSocket 信令服务器地址</li>
          <li><strong>VITE_DEFAULT_AUTH_TOKEN</strong>: 访问授权密钥</li>
        </ul>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Connection, Monitor, Document, VideoCamera } from '@element-plus/icons-vue'

const showDocDialog = ref(false)

const comparisonData = [
  {
    feature: '技术依赖',
    icon: 'Link',
    webrtc: '依赖 @unity/render-streaming npm 包，需集成 WebRTC API',
    webrtcTag: '需安装',
    webrtcTagType: 'warning',
    iframe: '无特殊依赖，仅使用浏览器原生 iframe 标签',
    iframeTag: '零依赖',
    iframeTagType: 'success'
  },
  {
    feature: 'URS 对接',
    icon: 'Key',
    webrtc: '需要对接 URS 项目，配置服务器地址、密钥、房间ID',
    webrtcTag: '必须',
    webrtcTagType: 'danger',
    iframe: '无需对接 URS，直接嵌入第三方渲染页面',
    iframeTag: '免对接',
    iframeTagType: 'success'
  },
  {
    feature: '启动速度',
    icon: 'Timer',
    webrtc: '初始化 WebRTC 连接需建立信令通道，首次启动约 2-5 秒',
    webrtcTag: '中等',
    webrtcTagType: 'warning',
    iframe: '页面加载完成后即可显示，iframe 加载取决于目标页面',
    iframeTag: '较快',
    iframeTagType: 'success'
  },
  {
    feature: '渲染性能',
    icon: 'Cpu',
    webrtc: '原生 WebRTC 传输，延迟低（50-150ms），支持高帧率',
    webrtcTag: '高性能',
    webrtcTagType: 'success',
    iframe: '受限于 iframe 渲染和跨页面通信，延迟相对较高',
    iframeTag: '一般',
    iframeTagType: 'info'
  },
  {
    feature: '控制能力',
    icon: 'Settings',
    webrtc: '完整的 SDK API 控制（播放、暂停、分辨率、码率等）',
    webrtcTag: '完整',
    webrtcTagType: 'success',
    iframe: '通过 postMessage 有限控制，依赖目标页面实现',
    iframeTag: '受限',
    iframeTagType: 'warning'
  },
  {
    feature: '适用场景',
    icon: 'Monitor',
    webrtc: '实时交互场景（云游戏、远程设计、VR预览）',
    webrtcTag: '专业场景',
    iframe: '快速集成场景（演示、简单预览、第三方嵌入）',
    iframeTag: '简单场景',
    iframeTagType: 'info'
  }
]
</script>

<style scoped>
.home-view {
  padding-bottom: 40px;
}

.intro-card {
  margin-bottom: 20px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 8px;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.tech-comparison {
  margin: 20px 0;
}

.feature-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-icon {
  color: #409eff;
}

.feature-name {
  font-weight: 500;
}

.webrtc-cell,
.iframe-cell {
  padding: 4px 0;
}

.cell-tag {
  margin-bottom: 4px;
}

.cell-content {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 520px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .action-buttons :deep(.el-button) {
    width: 100%;
  }
}

.feature-cards {
  margin-top: 20px;
}

.feature-card {
  height: 100%;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon-large {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  margin: 0 0 16px;
  color: #303133;
}

.feature-card ul {
  text-align: left;
  padding-left: 20px;
  margin: 0 0 20px;
  color: #606266;
}

.feature-card li {
  margin-bottom: 8px;
}

.webrtc-feature {
  border-top: 3px solid #409eff;
}

.iframe-feature {
  border-top: 3px solid #67c23a;
}

.doc-feature {
  border-top: 3px solid #e6a23c;
}

.practice-feature {
  border-top: 3px solid #e6a23c;
}

.doc-content {
  line-height: 1.8;
}

.doc-content h4 {
  margin-top: 20px;
  margin-bottom: 12px;
  color: #303133;
}

.doc-content code {
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.doc-content ol,
.doc-content ul {
  padding-left: 20px;
}

.doc-content li {
  margin-bottom: 8px;
}
</style>
