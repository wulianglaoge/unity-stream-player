declare module '@/utils/render-streaming/renderstreaming.js' {
  export class RenderStreaming {
    constructor(signaling: any, config: any);
    onConnect: (connectionId: string) => void;
    onDisconnect: (connectionId: string) => void;
    onGotOffer: (connectionId: string) => void;
    onGotAnswer: (connectionId: string) => void;
    onTrackEvent: (data: any) => void;
    onAddChannel: (data: any) => void;
    createConnection(connectionId?: string): Promise<void>;
    deleteConnection(): Promise<void>;
    createDataChannel(label: string): RTCDataChannel | null;
    addTrack(track: MediaStreamTrack): RTCRtpSender | null;
    addTransceiver(trackOrKind: any, init?: any): RTCRtpTransceiver | null;
    getTransceivers(): RTCRtpTransceiver[] | null;
    getStats(): Promise<RTCStatsReport> | null;
    start(): Promise<void>;
    stop(): Promise<void>;
  }
}

declare module '@/utils/render-streaming/signaling.js' {
  export class Signaling extends EventTarget {
    constructor(interval?: number);
    start(): Promise<void>;
    stop(): Promise<void>;
    createConnection(connectionId: string): Promise<any>;
    deleteConnection(connectionId: string): Promise<any>;
    sendOffer(connectionId: string, sdp: string): void;
    sendAnswer(connectionId: string, sdp: string): void;
    sendCandidate(connectionId: string, candidate: string, sdpMid: string, sdpMLineIndex: number): void;
  }

  export class WebSocketSignaling extends EventTarget {
    constructor(interval?: number);
    start(): Promise<void>;
    stop(): Promise<void>;
    createConnection(connectionId: string): void;
    deleteConnection(connectionId: string): void;
    sendOffer(connectionId: string, sdp: string): void;
    sendAnswer(connectionId: string, sdp: string): void;
    sendCandidate(connectionId: string, candidate: string, sdpMid: string, sdpMLineIndex: number): void;
    websocket: WebSocket;
    isWsOpen: boolean;
  }
}

declare module '@/utils/render-streaming/inputdevice.js' {
  export class InputDevice {
    name: string;
    layout: string;
    deviceId: number;
    usages: string[];
    description: any;
    _inputState: any;
    updateState(state: any): void;
    queueEvent(event: any): void;
    get currentState(): any;
  }

  export class Mouse extends InputDevice {
    constructor(name: string, layout: string, deviceId: number, usages: string[], description: any);
    queueEvent(event: MouseEvent | WheelEvent): void;
  }

  export class Keyboard extends InputDevice {
    static keycount: number;
    constructor(name: string, layout: string, deviceId: number, usages: string[], description: any);
    queueEvent(event: KeyboardEvent): void;
  }

  export class Touchscreen extends InputDevice {
    constructor(name: string, layout: string, deviceId: number, usages: string[], description: any);
    queueEvent(event: TouchEvent, time: number): void;
  }

  export class StateEvent {
    static format: number;
    static from(device: InputDevice, time?: number): StateEvent;
    static fromState(state: any, deviceId: number, time: number): StateEvent;
    baseEvent: any;
    stateFormat: number;
    stateData: ArrayBuffer;
    get buffer(): ArrayBuffer;
  }
}

declare module '@/utils/render-streaming/inputremoting.js' {
  export class InputRemoting {
    constructor(manager: any);
    startSending(): void;
    stopSending(): void;
    subscribe(observer: any): void;
  }

  export class NewEventsMsg {
    static create(event: any): any;
    static createStateEvent(device: any): any;
  }

  export class Message {
    constructor(participantId: number, type: number, data: ArrayBuffer);
    participant_id: number;
    type: number;
    length: number;
    data: ArrayBuffer;
    get buffer(): ArrayBuffer;
  }

  export class NewDeviceMsg {
    static create(device: any): Message;
  }

  export class RemoveDeviceMsg {
    static create(device: any): Message;
  }
}