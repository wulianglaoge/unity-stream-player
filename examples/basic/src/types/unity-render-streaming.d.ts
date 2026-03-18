// Unity Render Streaming 类型声明 - 本地实现

export interface RenderStreamingConfig {
  /** 信令服务器地址 */
  signalingUrl: string
  /** 房间ID */
  roomId: string
  /** 授权密钥 */
  authToken?: string
  /** 视频元素 */
  videoElement: HTMLVideoElement
  /** 连接成功回调 */
  onConnect?: () => void
  /** 连接断开回调 */
  onDisconnect?: (reason: string) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 统计信息回调 */
  onStats?: (stats: StreamStats) => void
  /** 日志回调 */
  onLog?: (level: LogLevel, message: string) => void
}

export interface StreamStats {
  /** 帧率 */
  fps: number
  /** 延迟(ms) */
  latency: number
  /** 码率(kbps) */
  bitrate: number
  /** 分辨率宽度 */
  width: number
  /** 分辨率高度 */
  height: number
  /** 丢包率 */
  packetLoss: number
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed'

/** 输入数据类型 */
export interface InputData {
  type: 'keyboard' | 'mouse' | 'touch' | 'gamepad' | 'custom'
  data: unknown
}

/** 键盘输入 */
export interface KeyboardInput {
  type: 'keydown' | 'keyup' | 'keypress'
  key: string
  code: string
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  metaKey: boolean
}

/** 鼠标输入 */
export interface MouseInput {
  type: 'mousedown' | 'mouseup' | 'mousemove' | 'click' | 'dblclick' | 'wheel'
  x: number
  y: number
  button?: number
  buttons?: number
  deltaX?: number
  deltaY?: number
  deltaZ?: number
}

/** 触摸输入 */
export interface TouchInput {
  type: 'touchstart' | 'touchend' | 'touchmove' | 'touchcancel'
  touches: Array<{ x: number; y: number; id: number }>
  changedTouches: Array<{ x: number; y: number; id: number }>
}

export class RenderStreaming {
  constructor(config: RenderStreamingConfig)

  /** 连接状态 */
  readonly connectionState: ConnectionState

  /** 连接流 */
  connect(): Promise<void>

  /** 断开连接 */
  disconnect(): void

  /** 播放 */
  play(): void

  /** 暂停 */
  pause(): void

  /** 切换分辨率 */
  setResolution(width: number, height: number): Promise<void>

  /** 发送输入事件到Unity */
  sendInput(data: InputData): void

  /** 销毁实例 */
  dispose(): void
}
