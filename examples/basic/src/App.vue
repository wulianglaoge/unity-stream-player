<template>
  <div class="app">
    <nav class="nav">
      <div class="nav-inner">
        <a class="logo" @click="$router.push('/')">
          <span class="logo-icon">◆</span>
          Unity Stream Player
        </a>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/demo" class="nav-link">基础演示</router-link>
          <router-link to="/iframe" class="nav-link">Iframe 嵌入</router-link>
          <router-link to="/practice" class="nav-link">全屏演示</router-link>
        </div>
      </div>
    </nav>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.app {
  min-height: 100vh;
}

.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.logo-icon {
  color: #6366f1;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.router-link-active {
  color: #f1f5f9;
  background: rgba(99, 102, 241, 0.15);
}

.main {
  padding-top: 60px;
}
</style>
