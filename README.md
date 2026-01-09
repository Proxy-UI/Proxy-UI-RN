# Proxy UI

iOS 代理客户端，支持加密传输和智能分流。

## 功能特性

- AES-256-GCM 加密传输
- 智能分流（Auto Proxy 模式）
- 实时日志查看与过滤
- 支持与 Shadowrocket 配合使用

## 安装

从 [Releases](https://github.com/Proxy-UI/Proxy-UI-RN/releases) 下载最新 IPA 文件，通过 AltStore 或其他方式安装。

## 使用方法

### 基本配置

1. 打开 Proxy UI
2. 填写服务器信息：
   - Server：服务器地址
   - Server Port：服务器端口
   - Local Port：本地监听端口（默认 7890）
   - Session Key：32 位密钥
3. 点击 Start Proxy

### 代理模式

| 模式       | Auto Proxy | Reverse Geo | 说明                     |
| ---------- | ---------- | ----------- | ------------------------ |
| 全局代理   | OFF        | -           | 所有流量走代理           |
| 正向代理   | ON         | OFF         | 国内直连，国外走代理     |
| 反向代理   | ON         | ON          | 国外直连，国内走代理     |

### 配合 Shadowrocket 使用

单独使用 Proxy UI 只能代理 WiFi 流量。配合 Shadowrocket 可实现全局代理（WiFi + 蜂窝数据）。

1. 启动 Proxy UI，**关闭 Auto Proxy**
2. 导入 Shadowrocket 配置（见 `docs/shadowrocket.conf`）
3. 连接 Shadowrocket

详细教程：
- [中文指南](docs/ios-user-guide-cn.md)
- [English Guide](docs/ios-user-guide-en.md)

## 常见问题

**Shadowrocket 显示 LocalProxy 超时**
- 确保 Proxy UI 已启动且状态为绿色
- 检查本地端口是否与 Shadowrocket 配置一致

**无法上网**
- 确认服务器地址和密钥正确
- 查看日志排查连接问题

**为什么要关闭 Auto Proxy？**
- 与 Shadowrocket 配合时，分流由 Shadowrocket 处理
- 开启 Auto Proxy 会导致回环问题
