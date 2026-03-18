<template>
  <div class="iframe-view">
    <el-row :gutter="20">
      <!-- 左侧：iframe 显示区 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="iframe-card">
          <template #header>
            <div class="card-header">
              <span>Iframe 嵌入渲染</span>
              <div class="status-badges">
                <el-tag
                  :type="iframeStatusType"
                  effect="dark"
                  class="status-tag"
                >
                  {{ iframeStatusText }}
                </el-tag>
                <el-tag v-if="isCommunicationReady" type="success" effect="dark">
                  通信就绪
                </el-tag>
              </div>
            </div>
          </template>

          <div class="iframe-container" :class="{ 'loaded': isLoaded }">
            <iframe
              ref="iframeRef"
              class="render-iframe"
              :src="iframeUrl"
              allow="fullscreen; autoplay; encrypted-media; pointer-lock; gamepad"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation allow-pointer-lock"
              @load="handleIframeLoad"
              @error="handleIframeError"
            ></iframe>

            <div v-if="!isLoaded && !loadError" class="iframe-placeholder">
              <el-icon class="placeholder-icon" :size="64"><Monitor /></el-icon>
              <p>Iframe 加载中...</p>
            </div>

            <div v-if="loadError" class="error-overlay">
              <el-icon class="error-icon" :size="48" color="#f56c6c"><CircleClose /></el-icon>
              <p>加载失败</p>
              <p class="error-detail">{{ loadError }}</p>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="control-panel">
            <el-button-group>
              <el-button
                type="primary"
                :disabled="!isCommunicationReady"
                @click="sendCommand('play')"
              >
                <el-icon><VideoPlay /></el-icon>
                播放
              </el-button>
              <el-button
                type="warning"
                :disabled="!isCommunicationReady"
                @click="sendCommand('pause')"
              >
                <el-icon><VideoPause /></el-icon>
                暂停
              </el-button>
              <el-button
                type="info"
                :disabled="!isCommunicationReady"
                @click="sendCommand('fullscreen')"
              >
                <el-icon><FullScreen /></el-icon>
                全屏
              </el-button>
              <el-button
                type="success"
                :disabled="!isCommunicationReady"
                @click="sendCommand('reset')"
              >
                <el-icon><Refresh /></el-icon>
                重置视角
              </el-button>
            </el-button-group>

            <el-divider direction="vertical" />

            <el-button @click="reloadIframe">
              <el-icon><RefreshRight /></el-icon>
              重新加载
            </el-button>
          </div>
        </el-card>

        <!-- 通信状态说明 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <span>通信机制说明</span>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="通信方式">
              <div class="desc-content">
                <code>window.postMessage()</code> - HTML5 跨域通信标准 API
              </div>
            </el-descriptions-item>

            <el-descriptions-item label="消息格式">
              <pre class="code-block">{{
`{
  "source": "unity-render-parent",
  "command": "play",  // play | pause | fullscreen | reset
  "timestamp": 1704067200000,
  "data": {}
}`
              }}</pre>
            </el-descriptions-item>

            <el-descriptions-item label="响应格式">
              <pre class="code-block">{{
`{
  "source": "unity-render-child",
  "status": "success",
  "command": "play",
  "result": {}
}`
              }}</pre>
            </el-descriptions-item>

            <el-descriptions-item label="安全说明">
              <ul class="security-list">
                <li>必须验证 <code>event.origin</code> 以确保消息来源可信</li>
                <li>建议设置 <code>targetOrigin</code> 参数，避免消息泄漏</li>
                <li>复杂命令可携带签名或 Token 进行身份验证</li>
              </ul>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧：配置与日志 -->
      <el-col :xs="24" :lg="8">
        <!-- iframe 配置 -->
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-header">
              <span>Iframe 配置</span>
              <el-button link type="primary" @click="resetUrl">
                重置
              </el-button>
            </div>
          </template>

          <el-form label-position="top">
            <el-form-item label="嵌入页面地址">
              <el-input
                v-model="iframeUrl"
                placeholder="https://example.com/unity-render"
                :disabled="isLoaded"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="目标 Origin">
              <el-input
                v-model="targetOrigin"
                placeholder="https://example.com"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :disabled="isLoaded"
                @click="loadIframe"
                style="width: 100%"
              >
                <el-icon><View /></el-icon>
                加载页面
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 通信日志 -->
        <el-card shadow="hover" class="log-card">
          <template #header>
            <div class="log-header">
              <span>postMessage 通信日志</span>
              <div class="log-actions">
                <el-checkbox v-model="showDetails" size="small">
                  显示详情
                </el-checkbox>
                <el-button link type="danger" size="small" @click="clearMessages">
                  清空
                </el-button>
              </div>
            </div>
          </template>

          <div class="message-container">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message-entry"
              :class="`message-${msg.type}`"
            >
              <div class="message-header">
                <span class="message-time">{{ msg.time }}</span>
                <el-tag
                  size="small"
                  :type="msg.type === 'send' ? 'primary' : 'success'"
                  effect="dark"
                >
                  {{ msg.type === 'send' ? '发送' : '接收' }}
                </el-tag>
              </div>

              <div class="message-content">
                <strong>{{ msg.command || msg.data?.command || '消息' }}</strong>
              </div>

              <el-collapse v-if="showDetails" class="message-detail">
                <el-collapse-item title="原始数据">
                  <pre>{{ JSON.stringify(msg.raw, null, 2) }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div v-if="messages.length === 0" class="message-empty">
              <el-empty description="暂无通信记录">
                <template #image>
                  <el-icon :size="48" color="#dcdfe6"><ChatDotRound /></el-icon>
                </template>
              </el-empty>
            </div>
          </div>
        </el-card>

        <!-- 注意事项 -->
        <el-alert
          title="使用提示"
          type="info"
          :closable="false"
          class="tips-alert"
        >
          <ul class="tips-list">
            <li>Iframe 方案<strong>无需</strong>安装 任何 包</li>
            <li><strong>无需</strong>对接 URS 项目</li>
            <li>需要目标页面支持 postMessage 通信</li>
            <li>跨域场景需正确配置 CORS</li>
          </ul>
        </el-alert>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  VideoPlay,
  VideoPause,
  FullScreen,
  Refresh,
  RefreshRight,
  Link,
  Lock,
  View,
  CircleClose,
  ChatDotRound
} from '@element-plus/icons-vue'

interface MessageRecord {
  type: 'send' | 'receive'
  time: string
  command?: string
  data?: any
  raw: any
}

// 响应式数据
const iframeRef = ref<HTMLIFrameElement>()

const iframeUrl = ref(import.meta.env.VITE_IFRAME_RENDER_URL)
const targetOrigin = ref('*')
const isLoaded = ref(false)
const isCommunicationReady = ref(false)
const loadError = ref('')
const showDetails = ref(false)

const messages = reactive<MessageRecord[]>([])

// 计算属性
const iframeStatusText = computed(() => {
  if (loadError.value) return '加载失败'
  if (isCommunicationReady.value) return '运行中'
  if (isLoaded.value) return '已加载'
  return '未加载'
})

const iframeStatusType = computed(() => {
  if (loadError.value) return 'danger'
  if (isCommunicationReady.value) return 'success'
  if (isLoaded.value) return 'warning'
  return 'info'
})

// 方法
const loadIframe = () => {
  if (!iframeUrl.value) {
    ElMessage.warning('请输入嵌入页面地址')
    return
  }
  isLoaded.value = false
  loadError.value = ''
  isCommunicationReady.value = false
}

const handleIframeLoad = () => {
  isLoaded.value = true
  loadError.value = ''
  ElMessage.success('Iframe 加载成功')

  // 发送初始化消息
  setTimeout(() => {
    sendCommand('init')
  }, 1000)
}

const handleIframeError = () => {
  loadError.value = '无法加载指定页面，请检查地址是否正确'
  isLoaded.value = false
  ElMessage.error('Iframe 加载失败')
}

const reloadIframe = () => {
  isLoaded.value = false
  isCommunicationReady.value = false
  messages.length = 0
  loadError.value = ''

  nextTick(() => {
    isLoaded.value = true
  })
}

const resetUrl = () => {
  iframeUrl.value = import.meta.env.VITE_IFRAME_RENDER_URL
  targetOrigin.value = '*'
  ElMessage.info('配置已重置')
}

const sendCommand = (command: string, data: any = {}) => {
  if (!iframeRef.value || !iframeRef.value.contentWindow) {
    ElMessage.warning('Iframe 未就绪')
    return
  }

  const message = {
    source: 'unity-render-parent',
    command,
    timestamp: Date.now(),
    data
  }

  iframeRef.value.contentWindow.postMessage(message, targetOrigin.value)

  messages.unshift({
    type: 'send',
    time: new Date().toLocaleTimeString('zh-CN'),
    command,
    raw: message
  })

  ElMessage.success(`已发送命令: ${command}`)
}

const handleMessage = (event: MessageEvent) => {
  // 安全检查：验证消息来源
  if (targetOrigin.value !== '*' && event.origin !== targetOrigin.value) {
    console.warn('收到来自未授权源的消息:', event.origin)
    return
  }

  const data = event.data

  // 验证消息格式
  if (data?.source === 'unity-render-child') {
    messages.unshift({
      type: 'receive',
      time: new Date().toLocaleTimeString('zh-CN'),
      command: data.command,
      data: data.result || data.data,
      raw: data
    })

    // 处理特定响应
    if (data.command === 'init' && data.status === 'ready') {
      isCommunicationReady.value = true
      ElMessage.success('子页面通信就绪')
    }
  }
}

const clearMessages = () => {
  messages.length = 0
}

// 生命周期
onMounted(() => {
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})

import { nextTick, computed } from 'vue'
</script>

<style scoped>
.iframe-view {
  padding-bottom: 20px;
}

.iframe-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badges {
  display: flex;
  gap: 8px;
}

.iframe-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.render-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
}

.iframe-placeholder,
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #606266;
  text-align: center;
}

.error-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.placeholder-icon,
.error-icon {
  margin-bottom: 16px;
}

.error-detail {
  color: #f56c6c;
  font-size: 12px;
  max-width: 80%;
  margin-top: 8px;
}

.control-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0 0;
}

.info-card {
  margin-bottom: 20px;
}

.desc-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code-block {
  background: #1a1a2e;
  color: #e4e7ed;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

.security-list {
  margin: 0;
  padding-left: 20px;
}

.security-list li {
  margin-bottom: 4px;
}

.security-list code {
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.config-card {
  margin-bottom: 20px;
}

.log-card {
  margin-bottom: 20px;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-container {
  height: 300px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
}

.message-entry {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-content {
  color: #303133;
  font-size: 14px;
}

.message-detail {
  margin-top: 8px;

  :deep(.el-collapse-item__header) {
    font-size: 12px;
    color: #909399;
  }

  pre {
    background: #1a1a2e;
    color: #e4e7ed;
    padding: 8px;
    border-radius: 4px;
    font-size: 11px;
    overflow-x: auto;
    margin: 0;
  }
}

.message-empty {
  padding: 20px 0;
}

.tips-alert {
  :deep(.el-alert__content) {
    width: 100%;
  }
}

.tips-list {
  margin: 8px 0 0;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 4px;
}
</style>
