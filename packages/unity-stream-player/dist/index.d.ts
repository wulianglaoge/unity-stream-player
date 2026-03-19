import { default as UnityStreamPlayer, ConnectionStatus, ConnectionError, Diagnostics, DataChannelMessage } from './index.vue';
import { App } from 'vue';

export { UnityStreamPlayer };
export type { ConnectionStatus, ConnectionError, Diagnostics, DataChannelMessage };
declare const _default: {
    install(app: App): void;
};
export default _default;
export type UnityStreamPlayerInstance = InstanceType<typeof UnityStreamPlayer>;
