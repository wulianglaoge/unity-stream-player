// 为 JS 模块声明类型
declare module './signaling.js' {
  export class WebSocketSignaling {
    constructor(url: string)
    connect(): void
    disconnect(): void
    addEventListener(event: string, handler: (event: any) => void): void
    removeEventListener(event: string, handler: (event: any) => void): void
    send(data: any): void
  }
}

declare module './renderstreaming.js' {
  export class RenderStreaming {
    constructor(signaling: any, config: any)
    addEventListener(event: string, handler: (event: any) => void): void
    removeEventListener(event: string, handler: (event: any) => void): void
    stop(): void
  }
}

declare module './sender.js' {
  export class Sender {
    constructor()
    addMouse: any
    addKeyboard: any
    addTouch: any
    addGamepad: any
  }

  export interface Observer {
    onOpen?: () => void
    onClose?: () => void
    onError?: (error: Error) => void
  }
}

declare module './inputremoting.js' {
  export class InputRemoting {
    constructor(sender: any, channel: any)
    start(): void
    stop(): void
    addEventListener(event: string, handler: (event: any) => void): void
    removeEventListener(event: string, handler: (event: any) => void): void
  }
}
