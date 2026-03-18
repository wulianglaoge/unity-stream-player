import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import WebRTCView from '@/views/WebRTCView.vue'
import IframeView from '@/views/IframeView.vue'
import PracticeDemoView from '@/views/PracticeDemoView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/demo',
    name: 'Demo',
    component: WebRTCView,
    meta: { title: '基础演示' }
  },
  {
    path: '/iframe',
    name: 'Iframe',
    component: IframeView,
    meta: { title: 'Iframe 嵌入' }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: PracticeDemoView,
    meta: { title: '全屏演示' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '页面'} - Unity Stream Player 示例`
  next()
})

export default router
