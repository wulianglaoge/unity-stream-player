<template>
  <div class="app-container">
    <el-container>
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><VideoCamera /></el-icon>
            Unity实时渲染流对比示例
          </h1>
          <el-menu
            :default-active="$route.path"
            mode="horizontal"
            router
            class="nav-menu"
          >
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>方案对比</span>
            </el-menu-item>
            <el-menu-item index="/webrtc">
              <el-icon><Connection /></el-icon>
              <span>WebRTC方案</span>
            </el-menu-item>
            <el-menu-item index="/iframe">
              <el-icon><Monitor /></el-icon>
              <span>Iframe方案</span>
            </el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      <el-footer class="app-footer">
        <p>Unity Render Streaming 技术方案对比演示 | Vue3 + Vite + Element Plus</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera, HomeFilled, Connection, Monitor } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.app-header {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  gap: 20px;
}

.app-title {
  flex-shrink: 0;
  white-space: nowrap;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-menu {
  border-bottom: none;
  flex-shrink: 0;
  min-width: 500px;
  overflow: visible;
}

.nav-menu :deep(.el-menu-item) {
  padding: 0 8px;
  font-size: 14px;
}

.nav-menu :deep(.el-menu-item span) {
  display: inline;
}

.nav-menu :deep(.el-menu-item .el-icon) {
  margin-right: 4px;
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.app-footer {
  background: #fff;
  text-align: center;
  color: #909399;
  font-size: 14px;
  border-top: 1px solid #ebeef5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
