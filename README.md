# Proxy UI

[中文文档](README_CN.md)

iOS proxy client with encrypted transmission and smart routing.

## Features

- AES-256-GCM encrypted transmission
- Smart routing (Auto Proxy mode)
- Real-time log viewer with filtering
- Shadowrocket integration support

## Installation

Download the latest IPA from [Releases](https://github.com/Proxy-UI/Proxy-UI-RN/releases) and install via AltStore or similar tools.

## Usage

### Basic Setup

1. Open Proxy UI
2. Enter server info:
   - Server: server address
   - Server Port: server port
   - Local Port: local listening port (default 7890)
   - Session Key: 32-character key
3. Tap Start Proxy

### Proxy Modes

| Mode          | Auto Proxy | Reverse Geo | Description                    |
| ------------- | ---------- | ----------- | ------------------------------ |
| All Proxy     | OFF        | -           | All traffic via proxy          |
| Forward Proxy | ON         | OFF         | CN direct, others via proxy    |
| Reverse Proxy | ON         | ON          | Others direct, CN via proxy    |

### With Shadowrocket

Proxy UI alone only proxies WiFi traffic. Use with Shadowrocket for global proxy (WiFi + Cellular).

1. Start Proxy UI with **Auto Proxy OFF**
2. Import Shadowrocket config (see `docs/shadowrocket.conf`)
3. Connect Shadowrocket

Detailed guides:
- [中文指南](docs/ios-user-guide-cn.md)
- [English Guide](docs/ios-user-guide-en.md)

## FAQ

**LocalProxy timeout in Shadowrocket**
- Ensure Proxy UI is running (green status)
- Check local port matches Shadowrocket config

**Cannot access internet**
- Verify server address and key are correct
- Check logs for connection issues

**Why disable Auto Proxy?**
- When using with Shadowrocket, routing is handled by Shadowrocket
- Enabling Auto Proxy causes loop issues
