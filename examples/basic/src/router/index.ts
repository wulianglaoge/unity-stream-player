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
    meta: { title: '方案对比' }
  },
  {
    path: '/webrtc',
    name: 'WebRTC',
    component: WebRTCView,
    meta: { title: 'WebRTC方案演示' }
  },
  {
    path: '/iframe',
    name: 'Iframe',
    component: IframeView,
    meta: { title: 'Iframe方案演示' }
  },
  {
    path: '/practice',
    name: 'PracticeDemo',
    component: PracticeDemoView,
    meta: { title: '实战演示' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '页面'} - Unity实时渲染流对比示例`
  next()
})

export default router
