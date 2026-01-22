import {useState, useEffect, useCallback} from 'react';
import {Proxy, ProxyEvents, ProxyConfig} from '../native/ProxyModule';

export interface LogEntry {
  id: string;
  level: number;
  message: string;
  timestamp: Date;
  connId: number | null;
}

const MAX_LOGS = 2000;
const MAX_LOGS_PER_CONN = 400;

const extractConnId = (message: string) => {
  const match = message.match(/conn_id:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

export function useProxy() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const sub = ProxyEvents.addListener('ProxyLog', event => {
      setLogs(prev => {
        const connId = extractConnId(event.message);
        const next = [
          ...prev,
          {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            level: event.level,
            message: event.message,
            timestamp: new Date(),
            connId,
          },
        ];

        if (connId !== null) {
          let count = 0;
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i].connId === connId) {
              count += 1;
              if (count > MAX_LOGS_PER_CONN) {
                next.splice(i, 1);
              }
            }
          }
        }

        if (next.length > MAX_LOGS) {
          next.splice(0, next.length - MAX_LOGS);
        }

        return next;
      });
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

  const getAutoDirectList = useCallback(() => Proxy.getAutoDirectList(), []);
  const getAutoDirectFailures = useCallback(() => Proxy.getAutoDirectFailures(), []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    isRunning,
    logs,
    start,
    stop,
    clearLogs,
    getAutoDirectList,
    getAutoDirectFailures,
  };
}
