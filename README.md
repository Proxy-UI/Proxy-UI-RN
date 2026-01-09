# Proxy UI

React Native iOS proxy client with Rust FFI backend.

## Features

- HTTP/HTTPS proxy with AES-256-GCM encryption
- Geo-based routing (Auto Proxy mode)
- Real-time log viewer with level filtering
- Shadowrocket integration support

## Quick Start

```bash
# Install dependencies
npm install
cd ios && bundle install && bundle exec pod install && cd ..

# Run
npx react-native run-ios
```

## Xcode Setup

Open `ios/ProxyUI.xcworkspace` and configure:

1. Add files to project: `ProxyBridge.h`, `ProxyBridge.mm`, `proxy_ffi.h`, `libhttp_proxy.a`
2. Link libraries: `libhttp_proxy.a`, `libresolv.tbd`
3. Build Settings:
   - Library Search Paths: `$(PROJECT_DIR)/ProxyUI`
   - Other Linker Flags: `-lhttp_proxy`
   - Header Search Paths: `$(PROJECT_DIR)/ProxyUI`

## Architecture

```
React Native UI (App.tsx)
       ↓
useProxy Hook (State + Events)
       ↓
ProxyBridge.mm (Objective-C++ Native Module)
       ↓
libhttp_proxy.a (Rust FFI)
```

## Usage with Shadowrocket

For global proxy (WiFi + Cellular), use with Shadowrocket:

1. Start Proxy UI with Auto Proxy **OFF**
2. Import Shadowrocket config from `docs/shadowrocket.conf`
3. Connect Shadowrocket

See [docs/ios-user-guide-cn.md](docs/ios-user-guide-cn.md) or [docs/ios-user-guide-en.md](docs/ios-user-guide-en.md) for detailed setup.

## Proxy Modes

| Mode | Auto Proxy | Reverse Geo | Behavior |
|------|------------|-------------|----------|
| All Proxy | OFF | - | All traffic via proxy |
| Forward | ON | OFF | CN direct, others proxy |
| Reverse | ON | ON | CN proxy, others direct |

When using with Shadowrocket, keep Auto Proxy OFF (geo routing handled by Shadowrocket).

## Troubleshooting

**Linker errors**: Verify `libhttp_proxy.a` is linked and Library Search Paths is set.

**DNS errors**: Add `libresolv.tbd` to Link Binary With Libraries.

**LocalProxy timeout in Shadowrocket**: Ensure Proxy UI is running before connecting Shadowrocket.
