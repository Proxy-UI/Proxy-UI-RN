#ifndef PROXY_FFI_H
#define PROXY_FFI_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Result codes
typedef enum {
    PROXY_OK = 0,
    PROXY_INVALID_PARAM = -1,
    PROXY_CONNECTION_FAILED = -2,
    PROXY_RUNTIME_ERROR = -3,
    PROXY_ALREADY_RUNNING = -4,
    PROXY_NOT_RUNNING = -5,
} ProxyResult;

// Opaque handle to the proxy client
typedef struct ProxyHandle ProxyHandle;

// Configuration for the proxy
typedef struct {
    const char* server_host;    // Remote proxy server hostname/IP
    uint16_t server_port;       // Remote proxy server port
    uint16_t local_port;        // Local listening port
    const char* session_key;    // Encryption session key (NULL for default)
    int auto_proxy;             // 0 = disabled (always proxy), 1 = enabled (geo-based)
    int reverse_geo;            // 0 = CN direct, 1 = CN proxy (reverse mode)
    const char* cache_dir;      // Cache directory for auto-proxy (required on mobile)
    const char* direct_domains; // Comma-separated domains for direct connect
    const char* need_codec_ips; // Comma-separated IPs that need codec (NULL for default)
    int force_codec;            // 0 = only specified IPs use codec, 1 = all use codec
    int set_system_proxy;       // desktop only: 0 = disabled, 1 = set system proxy
} ProxyConfig;

// Create a new proxy handle
// Returns NULL on failure
ProxyHandle* proxy_create(void);

// Start the proxy with the given configuration
// Returns PROXY_OK on success
ProxyResult proxy_start(ProxyHandle* handle, const ProxyConfig* config);

// Stop the proxy
// Returns PROXY_OK on success
ProxyResult proxy_stop(ProxyHandle* handle);

// Destroy the proxy handle and free resources
// The handle must not be used after this call
void proxy_destroy(ProxyHandle* handle);

// Check if proxy is running
// Returns 1 if running, 0 otherwise
int proxy_is_running(const ProxyHandle* handle);

// Initialize logging (call once at app startup)
void proxy_init_logging(void);

// Log callback function type
// level: 0=trace, 1=debug, 2=info, 3=warn, 4=error
typedef void (*LogCallback)(int level, const char* message);

// Set log callback function (call before proxy_init_logging)
// Pass NULL to disable callback
void proxy_set_log_callback(LogCallback callback);

// Free string allocated by proxy (e.g., from log callback or list functions)
void proxy_free_string(char* s);

// Get auto-direct list as JSON string
// Returns JSON like: {"ips":["1.2.3.4"],"domains":["example.com"]}
// Caller must free the returned string via proxy_free_string.
char* proxy_get_auto_direct_list(void);

// Get auto-direct failures as JSON string
// Returns JSON like: {"items":[{"host":"example.com","count":2,"last_error":"..."}]}
// Caller must free the returned string via proxy_free_string.
char* proxy_get_auto_direct_failures(void);

// ============================================
// Network Extension (Tunnel) API
// These functions are for use in PacketTunnelProvider
// ============================================

// Alias for ProxyConfig used in tunnel context
typedef ProxyConfig ProxyFFIConfig;

// Start proxy tunnel (for Network Extension)
// Returns 0 on success, non-zero on failure
int proxy_start_tunnel(const ProxyFFIConfig* config);

// Stop proxy tunnel
void proxy_stop_tunnel(void);

// Check if tunnel proxy is running
// Returns 1 if running, 0 otherwise
int proxy_is_running_tunnel(void);

#ifdef __cplusplus
}
#endif

#endif // PROXY_FFI_H
