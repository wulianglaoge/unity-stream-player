export type LogLevel = 'info' | 'success' | 'warning' | 'error'

export interface LogEntry {
  id: number
  timestamp: string
  level: LogLevel
  message: string
  detail?: string
}

let logId = 0

export function createLogger() {
  const logs = ref<LogEntry[]>([])

  const addLog = (level: LogLevel, message: string, detail?: string) => {
    const entry: LogEntry = {
      id: ++logId,
      timestamp: new Date().toLocaleTimeString('zh-CN'),
      level,
      message,
      detail
    }
    logs.value.unshift(entry)

    // 限制日志数量
    if (logs.value.length > 100) {
      logs.value.pop()
    }

    return entry
  }

  const info = (message: string, detail?: string) =>
    addLog('info', message, detail)
  const success = (message: string, detail?: string) =>
    addLog('success', message, detail)
  const warning = (message: string, detail?: string) =>
    addLog('warning', message, detail)
  const error = (message: string, detail?: string) =>
    addLog('error', message, detail)

  const clear = () => {
    logs.value = []
    logId = 0
  }

  return {
    logs: readonly(logs),
    info,
    success,
    warning,
    error,
    clear,
    addLog
  }
}

import { ref, readonly } from 'vue'
