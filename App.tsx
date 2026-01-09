import React, {useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useProxy, LogEntry} from './src/hooks/useProxy';

// 尝试加载本地开发配置（可选）
let DEV_CONFIG: {serverHost?: string; serverPort?: string; localPort?: string; sessionKey?: string} = {};
try {
  DEV_CONFIG = require('./config.local').DEV_CONFIG;
} catch {
  // config.local.ts 不存在，使用默认值
}

const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
const LOG_COLORS = ['gray', 'blue', 'green', 'orange', 'red'];

const LogItem = ({entry}: {entry: LogEntry}) => {
  return (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={{color: LOG_COLORS[entry.level], fontWeight: 'bold'}}>
          {LOG_LEVELS[entry.level]}
        </Text>
        <Text style={styles.logTime}>
          {entry.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.logMessage}>{entry.message}</Text>
    </View>
  );
};

const LogFilter = ({
  selected,
  onSelect,
}: {
  selected: Set<number>;
  onSelect: (level: number) => void;
}) => (
  <View style={styles.filterRow}>
    {LOG_LEVELS.map((name, level) => (
      <TouchableOpacity
        key={level}
        style={[
          styles.filterChip,
          selected.has(level) && {backgroundColor: LOG_COLORS[level]},
        ]}
        onPress={() => onSelect(level)}>
        <Text
          style={[
            styles.filterChipText,
            selected.has(level) && {color: 'white'},
          ]}>
          {name}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function App() {
  const {isRunning, logs, start, stop, clearLogs} = useProxy();
  const [serverHost, setServerHost] = useState(DEV_CONFIG.serverHost || '');
  const [serverPort, setServerPort] = useState(DEV_CONFIG.serverPort || '1081');
  const [localPort, setLocalPort] = useState(DEV_CONFIG.localPort || '1080');
  const [sessionKey, setSessionKey] = useState(DEV_CONFIG.sessionKey || '');
  const [autoProxy, setAutoProxy] = useState(true);
  const [reverseGeo, setReverseGeo] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [status, setStatus] = useState('Proxy stopped');
  const [logFilter, setLogFilter] = useState<Set<number>>(new Set([2, 3, 4])); // INFO, WARN, ERROR by default

  const toggleLogFilter = (level: number) => {
    setLogFilter(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const filteredLogs = logs.filter(log => logFilter.has(log.level));

  const toggleProxy = async () => {
    if (isRunning) {
      const ok = await stop();
      setStatus(ok ? 'Proxy stopped' : 'Failed to stop');
    } else {
      if (!serverHost) {
        setStatus('Please enter server host');
        return;
      }
      if (!sessionKey) {
        setStatus('Please enter session key');
        return;
      }
      const sPort = parseInt(serverPort, 10);
      const lPort = parseInt(localPort, 10);
      if (isNaN(sPort) || isNaN(lPort)) {
        setStatus('Invalid port number');
        return;
      }
      const ok = await start({
        serverHost,
        serverPort: sPort,
        localPort: lPort,
        sessionKey,
        autoProxy,
        reverseGeo,
      });
      const modeDesc = autoProxy
        ? reverseGeo
          ? 'reverse-geo'
          : 'auto-proxy'
        : 'all-proxy';
      setStatus(
        ok ? `Running on 127.0.0.1:${localPort} (${modeDesc})` : 'Failed to start',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView style={styles.flex}>
          <Text style={styles.title}>Proxy</Text>

          {/* Server Config Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Server Configuration</Text>
            <TextInput
              placeholder="Server Host"
              value={serverHost}
              onChangeText={setServerHost}
              editable={!isRunning}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              placeholder="Server Port"
              value={serverPort}
              onChangeText={setServerPort}
              keyboardType="numeric"
              editable={!isRunning}
              style={styles.input}
            />
            <TextInput
              placeholder="Local Port"
              value={localPort}
              onChangeText={setLocalPort}
              keyboardType="numeric"
              editable={!isRunning}
              style={styles.input}
            />
            <TextInput
              placeholder="Session Key"
              value={sessionKey}
              onChangeText={setSessionKey}
              secureTextEntry
              editable={!isRunning}
              style={styles.input}
            />
          </View>

          {/* Proxy Mode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proxy Mode</Text>
            <View style={styles.row}>
              <Text>Auto Proxy (Geo-based)</Text>
              <Switch
                value={autoProxy}
                onValueChange={setAutoProxy}
                disabled={isRunning}
              />
            </View>
            {autoProxy && (
              <>
                <View style={styles.row}>
                  <Text>Reverse Geo</Text>
                  <Switch
                    value={reverseGeo}
                    onValueChange={setReverseGeo}
                    disabled={isRunning}
                  />
                </View>
                <Text style={styles.hint}>
                  {reverseGeo
                    ? 'CN → Proxy, Others → Direct'
                    : 'CN → Direct, Others → Proxy'}
                </Text>
              </>
            )}
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.row}>
              <View
                style={[
                  styles.dot,
                  {backgroundColor: isRunning ? 'green' : 'red'},
                ]}
              />
              <Text>{status}</Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[
              styles.button,
              isRunning ? styles.buttonStop : styles.buttonStart,
            ]}
            onPress={toggleProxy}>
            <Text style={[styles.buttonText, isRunning && styles.buttonTextStop]}>
              {isRunning ? 'Stop Proxy' : 'Start Proxy'}
            </Text>
          </TouchableOpacity>

          {isRunning && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setShowInstructions(true)}>
              <Text style={styles.linkText}>How to configure iOS proxy</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setShowLogs(true)}>
            <Text style={styles.linkText}>View Logs ({logs.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Logs Modal */}
      <Modal visible={showLogs} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={clearLogs}>
              <Text style={styles.linkText}>Clear</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Logs</Text>
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowLogs(false)}>
              <Text style={styles.linkText}>Done</Text>
            </TouchableOpacity>
          </View>
          <LogFilter selected={logFilter} onSelect={toggleLogFilter} />
          <FlatList
            data={[...filteredLogs].reverse()}
            keyExtractor={item => item.id}
            renderItem={({item}) => <LogItem entry={item} />}
            style={styles.logList}
            contentContainerStyle={styles.logListContent}
          />
        </SafeAreaView>
      </Modal>

      {/* Instructions Modal */}
      <Modal visible={showInstructions} animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.placeholder} />
            <Text style={styles.modalTitle}>Setup Guide</Text>
            <TouchableOpacity onPress={() => setShowInstructions(false)}>
              <Text style={styles.linkText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>WiFi Proxy Setup</Text>
            <Text style={styles.instructionStep}>1. Open Settings app</Text>
            <Text style={styles.instructionStep}>2. Tap Wi-Fi</Text>
            <Text style={styles.instructionStep}>
              3. Tap (i) next to your network
            </Text>
            <Text style={styles.instructionStep}>
              4. Scroll down, tap Configure Proxy
            </Text>
            <Text style={styles.instructionStep}>5. Select Manual</Text>
            <Text style={styles.instructionStep}>6. Server: 127.0.0.1</Text>
            <Text style={styles.instructionStep}>7. Port: {localPort}</Text>
            <Text style={styles.instructionStep}>8. Tap Save</Text>

            <Text style={styles.noteTitle}>Note</Text>
            <Text style={styles.noteText}>
              This only proxies WiFi traffic. Cellular data will not go through
              the proxy.
            </Text>
            <Text style={styles.warningText}>
              Remember to set proxy back to Off when done.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  flex: {flex: 1},
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  dot: {width: 12, height: 12, borderRadius: 6, marginRight: 8},
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  buttonStart: {
    backgroundColor: '#007AFF',
  },
  buttonStop: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  buttonText: {color: 'white', fontWeight: '600', fontSize: 16},
  buttonTextStop: {color: '#ff4444'},
  linkButton: {alignItems: 'center', padding: 12},
  linkText: {color: '#007AFF', fontSize: 16},
  modal: {flex: 1, backgroundColor: '#f5f5f5'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {fontWeight: '600', fontSize: 17},
  placeholder: {width: 50},
  headerButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logList: {flex: 1},
  logListContent: {padding: 16},
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  logItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logTime: {fontSize: 13, color: '#999'},
  logMessage: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  instructions: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  instructionStep: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noteTitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  noteText: {fontSize: 14, color: '#666', marginBottom: 8},
  warningText: {fontSize: 14, color: 'orange'},
});
