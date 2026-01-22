import {NativeModules, NativeEventEmitter} from 'react-native';

const {ProxyBridge} = NativeModules;

export interface ProxyConfig {
  serverHost: string;
  serverPort: number;
  localPort: number;
  sessionKey: string;
  autoProxy: boolean;
  reverseGeo: boolean;
  directDomains: string;
}

export interface AutoDirectList {
  ips: string[];
  domains: string[];
}

export interface AutoDirectFailureItem {
  host: string;
  count: number;
  lastError: string;
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
      config.directDomains,
    ),
  stop: (): Promise<boolean> => ProxyBridge.stop(),
  isRunning: (): Promise<boolean> => ProxyBridge.isRunning(),
  getAutoDirectList: async (): Promise<AutoDirectList> => {
    const json = await ProxyBridge.getAutoDirectList();
    if (!json) {
      return {ips: [], domains: []};
    }
    try {
      const parsed = JSON.parse(json);
      return {
        ips: Array.isArray(parsed?.ips) ? parsed.ips : [],
        domains: Array.isArray(parsed?.domains) ? parsed.domains : [],
      };
    } catch {
      return {ips: [], domains: []};
    }
  },
  getAutoDirectFailures: async (): Promise<AutoDirectFailureItem[]> => {
    const json = await ProxyBridge.getAutoDirectFailures();
    if (!json) {
      return [];
    }
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed?.items)) {
        return [];
      }
      return parsed.items
        .filter(item => item && typeof item.host === 'string')
        .map(item => ({
          host: item.host,
          count: typeof item.count === 'number' ? item.count : 0,
          lastError: typeof item.last_error === 'string' ? item.last_error : '',
        }));
    } catch {
      return [];
    }
  },
};

export const ProxyEvents = new NativeEventEmitter(ProxyBridge);
