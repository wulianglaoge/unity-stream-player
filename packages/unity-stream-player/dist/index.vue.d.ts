export interface Diagnostics {
    width: number | null;
    height: number | null;
    bitrateKbps: number | null;
    fps: number | null;
    packetsLost: number | null;
    jitterMs: number | null;
    rttMs: number | null;
    framesDropped: number | null;
    codec: string | null;
    clockRate: number | null;
}
/** 连接状态类型 */
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'disconnected';
/** 连接错误类型 */
export interface ConnectionError {
    type: 'websocket' | 'webrtc' | 'signaling' | 'unknown';
    message: string;
    timestamp: number;
    retryable: boolean;
}
/** DataChannel 消息类型 */
export interface DataChannelMessage {
    data: string | ArrayBuffer;
    timestamp: number;
    connectionId: string;
}
declare function manualReconnect(): Promise<void>;
declare function getDiagnostics(): Promise<Diagnostics>;
declare function sendData(data: string | object): boolean;
declare function sendBinaryData(data: ArrayBuffer | Uint8Array): boolean;
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    /** WebSocket 信令服务器地址 */
    signalingUrl?: string;
    /** 首帧到来时是否自动全屏 */
    autoFullscreen?: boolean;
    /** 视频轨道内容提示 */
    contentHint?: "" | "detail" | "text" | "motion";
    /** 视频适应模式 */
    fit?: "contain" | "cover" | "fill";
    /** 是否启用自动重连 */
    enableReconnect?: boolean;
    /** 最大重连次数，默认 3 */
    maxReconnectAttempts?: number;
    /** 初始重连间隔(毫秒)，默认 1000 */
    reconnectInterval?: number;
    /** 重连间隔倍增因子，默认 2(指数退避) */
    reconnectBackoffMultiplier?: number;
    /** 最大重连间隔(毫秒)，默认 30000 */
    maxReconnectInterval?: number;
    /** 连接成功后是否显示指示器，默认 false */
    showConnectedIndicator?: boolean;
    /** 连接成功回调 */
    onConnect?: (connectionId: string) => void;
    /** 连接断开回调 */
    onDisconnect?: (connectionId: string, reason: string) => void;
    /** 连接错误回调 */
    onError?: (error: ConnectionError) => void;
    /** 连接状态变化回调 */
    onStatusChange?: (status: ConnectionStatus, prevStatus: ConnectionStatus) => void;
    /** 收到 DataChannel 消息回调 */
    onDataReceived?: (message: DataChannelMessage) => void;
    /** DataChannel 打开回调 */
    onDataChannelOpen?: (connectionId: string) => void;
    /** DataChannel 关闭回调 */
    onDataChannelClose?: (connectionId: string) => void;
    /** DataChannel 标签名，默认 'data' */
    dataChannelLabel?: string;
}>>, {
    getDiagnostics: typeof getDiagnostics;
    reconnect: typeof manualReconnect;
    connectionStatus: import('vue').Ref<ConnectionStatus, ConnectionStatus>;
    sendData: typeof sendData;
    sendBinaryData: typeof sendBinaryData;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    error: (error: ConnectionError) => void;
    connect: (connectionId: string) => void;
    disconnect: (connectionId: string, reason: string) => void;
    "status-change": (status: ConnectionStatus, prevStatus: ConnectionStatus) => void;
    "data-received": (message: DataChannelMessage) => void;
    "datachannel-open": (connectionId: string) => void;
    "datachannel-close": (connectionId: string) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    /** WebSocket 信令服务器地址 */
    signalingUrl?: string;
    /** 首帧到来时是否自动全屏 */
    autoFullscreen?: boolean;
    /** 视频轨道内容提示 */
    contentHint?: "" | "detail" | "text" | "motion";
    /** 视频适应模式 */
    fit?: "contain" | "cover" | "fill";
    /** 是否启用自动重连 */
    enableReconnect?: boolean;
    /** 最大重连次数，默认 3 */
    maxReconnectAttempts?: number;
    /** 初始重连间隔(毫秒)，默认 1000 */
    reconnectInterval?: number;
    /** 重连间隔倍增因子，默认 2(指数退避) */
    reconnectBackoffMultiplier?: number;
    /** 最大重连间隔(毫秒)，默认 30000 */
    maxReconnectInterval?: number;
    /** 连接成功后是否显示指示器，默认 false */
    showConnectedIndicator?: boolean;
    /** 连接成功回调 */
    onConnect?: (connectionId: string) => void;
    /** 连接断开回调 */
    onDisconnect?: (connectionId: string, reason: string) => void;
    /** 连接错误回调 */
    onError?: (error: ConnectionError) => void;
    /** 连接状态变化回调 */
    onStatusChange?: (status: ConnectionStatus, prevStatus: ConnectionStatus) => void;
    /** 收到 DataChannel 消息回调 */
    onDataReceived?: (message: DataChannelMessage) => void;
    /** DataChannel 打开回调 */
    onDataChannelOpen?: (connectionId: string) => void;
    /** DataChannel 关闭回调 */
    onDataChannelClose?: (connectionId: string) => void;
    /** DataChannel 标签名，默认 'data' */
    dataChannelLabel?: string;
}>>> & Readonly<{
    onError?: ((error: ConnectionError) => any) | undefined;
    onConnect?: ((connectionId: string) => any) | undefined;
    onDisconnect?: ((connectionId: string, reason: string) => any) | undefined;
    "onStatus-change"?: ((status: ConnectionStatus, prevStatus: ConnectionStatus) => any) | undefined;
    "onData-received"?: ((message: DataChannelMessage) => any) | undefined;
    "onDatachannel-open"?: ((connectionId: string) => any) | undefined;
    "onDatachannel-close"?: ((connectionId: string) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
