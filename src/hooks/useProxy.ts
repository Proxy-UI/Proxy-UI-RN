import {useState, useEffect, useCallback} from 'react';
import {Proxy, ProxyEvents, ProxyConfig} from '../native/ProxyModule';

export interface LogEntry {
  id: string;
  level: number;
  message: string;
  timestamp: Date;
}

export function useProxy() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const sub = ProxyEvents.addListener('ProxyLog', event => {
      setLogs(prev => [
        ...prev.slice(-499),
        {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          level: event.level,
          message: event.message,
          timestamp: new Date(),
        },
      ]);
    });
    return () => sub.remove();
  }, []);

  const start = useCallback(async (config: ProxyConfig) => {
    const ok = await Proxy.start(config);
    setIsRunning(ok);
    return ok;
  }, []);

  const stop = useCallback(async () => {
    const ok = await Proxy.stop();
    if (ok) {
      setIsRunning(false);
    }
    return ok;
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {isRunning, logs, start, stop, clearLogs};
}
