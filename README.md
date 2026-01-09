# Proxy-UI-RN

React Native iOS proxy client using Rust FFI.

## Setup

### 1. Install dependencies

```bash
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```

### 2. Configure Xcode

Open `ios/ProxyUI.xcworkspace` in Xcode and:

1. **Add Native Module files to project:**
   - Right-click on `ProxyUI` folder → Add Files to "ProxyUI"
   - Select `ProxyBridge.h`, `ProxyBridge.mm`, `proxy_ffi.h`, `libhttp_proxy.a`
   - Make sure "Copy items if needed" is unchecked (files are already in place)

2. **Link static library:**
   - Select ProxyUI target → Build Phases → Link Binary With Libraries
   - Click + and add `libhttp_proxy.a` (from ProxyUI folder)
   - Click + and add `libresolv.tbd`

3. **Configure build settings:**
   - Select ProxyUI target → Build Settings
   - Search "Library Search Paths" and add: `$(PROJECT_DIR)/ProxyUI`
   - Search "Other Linker Flags" and add: `-lhttp_proxy`
   - Search "Header Search Paths" and add: `$(PROJECT_DIR)/ProxyUI`

4. **Create Bridging Header (if needed):**
   - If Xcode asks to create a bridging header, click "Create"
   - Or manually create `ProxyUI-Bridging-Header.h` with content:
     ```objc
     #import "ProxyBridge.h"
     ```

### 3. Run the app

```bash
npx react-native run-ios
```

Or open `ios/ProxyUI.xcworkspace` in Xcode and press Cmd+R.

## Usage

1. Enter your proxy server host, port, and session key
2. Toggle Auto Proxy (geo-based routing) if needed
3. Tap "Start Proxy"
4. Configure iOS WiFi proxy to 127.0.0.1:1080
5. View logs by tapping "View Logs"

## Architecture

```
App.tsx (React Native UI)
    ↓
src/hooks/useProxy.ts (State management)
    ↓
src/native/ProxyModule.ts (TypeScript interface)
    ↓
ProxyBridge.mm (Objective-C++ Native Module)
    ↓
libhttp_proxy.a (Rust FFI static library)
```

## Troubleshooting

### Linker errors

If you see "undefined symbol" errors for `proxy_*` functions:
- Verify `libhttp_proxy.a` is added to "Link Binary With Libraries"
- Check "Library Search Paths" includes `$(PROJECT_DIR)/ProxyUI`
- Ensure "Other Linker Flags" includes `-lhttp_proxy`

### Missing libresolv

If you see errors about `res_query` or DNS functions:
- Add `libresolv.tbd` to "Link Binary With Libraries"
