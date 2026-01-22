#import "ProxyBridge.h"
#import "proxy_ffi.h"
#import <string.h>
#import <stdlib.h>

static ProxyBridge *sharedInstance = nil;
static BOOL loggingInitialized = NO;

static void logCallback(int level, const char *message) {
    if (message) {
        NSString *msg = [NSString stringWithUTF8String:message];
        NSArray *levels = @[@"TRACE", @"DEBUG", @"INFO", @"WARN", @"ERROR"];
        NSString *levelStr = level < 5 ? levels[level] : @"UNKNOWN";
        NSLog(@"[Proxy][%@] %@", levelStr, msg);

        if (sharedInstance) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [sharedInstance sendEventWithName:@"ProxyLog"
                                             body:@{@"level": @(level), @"message": msg}];
            });
        }
    }
}

@implementation ProxyBridge {
    ProxyHandle *_handle;
    BOOL _hasListeners;
}

RCT_EXPORT_MODULE();

- (instancetype)init {
    if (self = [super init]) {
        sharedInstance = self;
    }
    return self;
}

- (void)ensureInitialized {
    if (!loggingInitialized) {
        loggingInitialized = YES;
        proxy_set_log_callback(logCallback);
        proxy_init_logging();
    }
    if (!_handle) {
        _handle = proxy_create();
    }
}

- (void)dealloc {
    if (_handle) proxy_destroy(_handle);
    sharedInstance = nil;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"ProxyLog"];
}

- (void)startObserving { _hasListeners = YES; }
- (void)stopObserving { _hasListeners = NO; }

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(start:(NSString *)host port:(int)port localPort:(int)lPort
                  key:(NSString *)key autoProxy:(BOOL)autoProxyEnabled reverseGeo:(BOOL)rev
                  directDomains:(NSString *)directDomains
                  resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    [self ensureInitialized];
    if (!_handle) {
        resolve(@NO);
        return;
    }

    // Get cache directory for auto-proxy
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *cacheDir = paths.firstObject;

    // Copy strings to ensure they remain valid during proxy_start
    const char *hostStr = strdup([host UTF8String]);
    const char *cacheDirStr = cacheDir ? strdup([cacheDir UTF8String]) : NULL;
    const char *keyStr = (key.length == 32) ? strdup([key UTF8String]) : NULL;
    const char *directDomainsStr =
        (directDomains.length > 0) ? strdup([directDomains UTF8String]) : NULL;

    ProxyConfig config = {
        .server_host = hostStr,
        .server_port = (uint16_t)port,
        .local_port = (uint16_t)lPort,
        .session_key = keyStr,
        .auto_proxy = autoProxyEnabled ? 1 : 0,
        .reverse_geo = rev ? 1 : 0,
        .cache_dir = cacheDirStr,
        .direct_domains = directDomainsStr,
        .need_codec_ips = NULL,
        .force_codec = 0,
        .set_system_proxy = 0
    };
    ProxyResult result = proxy_start(_handle, &config);

    // Free copied strings
    free((void *)hostStr);
    if (cacheDirStr) free((void *)cacheDirStr);
    if (keyStr) free((void *)keyStr);
    if (directDomainsStr) free((void *)directDomainsStr);

    resolve(@(result == PROXY_OK));
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    if (!_handle) {
        resolve(@NO);
        return;
    }
    resolve(@(proxy_stop(_handle) == PROXY_OK));
}

RCT_EXPORT_METHOD(isRunning:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    if (!_handle) {
        resolve(@NO);
        return;
    }
    resolve(@(proxy_is_running(_handle) != 0));
}

RCT_EXPORT_METHOD(getAutoDirectList:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    [self ensureInitialized];
    char *result = proxy_get_auto_direct_list();
    if (!result) {
        resolve(@"");
        return;
    }
    NSString *json = [NSString stringWithUTF8String:result];
    proxy_free_string(result);
    resolve(json ? json : @"");
}

RCT_EXPORT_METHOD(getAutoDirectFailures:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    [self ensureInitialized];
    char *result = proxy_get_auto_direct_failures();
    if (!result) {
        resolve(@"");
        return;
    }
    NSString *json = [NSString stringWithUTF8String:result];
    proxy_free_string(result);
    resolve(json ? json : @"");
}

@end
