import {NativeModules, NativeEventEmitter} from 'react-native';

const {ProxyBridge} = NativeModules;

export interface ProxyConfig {
  serverHost: string;
  serverPort: number;
  localPort: number;
  sessionKey: string;
  autoProxy: boolean;
  reverseGeo: boolean;
}

export const Proxy = {
  start: (config: ProxyConfig): Promise<boolean> =>
    ProxyBridge.start(
      config.serverHost,
      config.serverPort,
      config.localPort,
      config.sessionKey,
      config.autoProxy,
      config.reverseGeo,
    ),
  stop: (): Promise<boolean> => ProxyBridge.stop(),
  isRunning: (): Promise<boolean> => ProxyBridge.isRunning(),
};

export const ProxyEvents = new NativeEventEmitter(ProxyBridge);
