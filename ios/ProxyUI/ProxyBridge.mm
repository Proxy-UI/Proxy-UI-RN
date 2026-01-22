#import "ProxyBridge.h"
#import "proxy_ffi.h"
#import <string.h>
#import <stdlib.h>
#import <dlfcn.h>

static ProxyBridge *sharedInstance = nil;
static BOOL loggingInitialized = NO;
static BOOL optionalSymbolsLoaded = NO;
static BOOL hasAutoDirectApi = NO;

typedef void (*ProxySetLogCallbackFn)(LogCallback callback);
typedef void (*ProxyInitLoggingFn)(void);
typedef void (*ProxyFreeStringFn)(char *s);
typedef char *(*ProxyGetAutoDirectListFn)(void);
typedef char *(*ProxyGetAutoDirectFailuresFn)(void);

static ProxySetLogCallbackFn p_proxy_set_log_callback = NULL;
static ProxyInitLoggingFn p_proxy_init_logging = NULL;
static ProxyFreeStringFn p_proxy_free_string = NULL;
static ProxyGetAutoDirectListFn p_proxy_get_auto_direct_list = NULL;
static ProxyGetAutoDirectFailuresFn p_proxy_get_auto_direct_failures = NULL;

static void loadOptionalSymbols(void) {
    if (optionalSymbolsLoaded) {
        return;
    }
    optionalSymbolsLoaded = YES;
    void *handle = RTLD_DEFAULT;
    p_proxy_set_log_callback = (ProxySetLogCallbackFn)dlsym(handle, "proxy_set_log_callback");
    p_proxy_init_logging = (ProxyInitLoggingFn)dlsym(handle, "proxy_init_logging");
    p_proxy_free_string = (ProxyFreeStringFn)dlsym(handle, "proxy_free_string");
    p_proxy_get_auto_direct_list =
        (ProxyGetAutoDirectListFn)dlsym(handle, "proxy_get_auto_direct_list");
    p_proxy_get_auto_direct_failures =
        (ProxyGetAutoDirectFailuresFn)dlsym(handle, "proxy_get_auto_direct_failures");
    hasAutoDirectApi =
        p_proxy_get_auto_direct_list && p_proxy_get_auto_direct_failures && p_proxy_free_string;
}

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
    loadOptionalSymbols();
    if (!loggingInitialized) {
        loggingInitialized = YES;
        if (p_proxy_set_log_callback) {
            p_proxy_set_log_callback(logCallback);
        }
        if (p_proxy_init_logging) {
            p_proxy_init_logging();
        }
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
    if (!hasAutoDirectApi) {
        if (directDomainsStr) {
            free((void *)directDomainsStr);
        }
        directDomainsStr = NULL;
    }

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
    if (!p_proxy_get_auto_direct_list || !p_proxy_free_string) {
        resolve(@"");
        return;
    }
    char *result = p_proxy_get_auto_direct_list();
    if (!result) {
        resolve(@"");
        return;
    }
    NSString *json = [NSString stringWithUTF8String:result];
    p_proxy_free_string(result);
    resolve(json ? json : @"");
}

RCT_EXPORT_METHOD(getAutoDirectFailures:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    [self ensureInitialized];
    if (!p_proxy_get_auto_direct_failures || !p_proxy_free_string) {
        resolve(@"");
        return;
    }
    char *result = p_proxy_get_auto_direct_failures();
    if (!result) {
        resolve(@"");
        return;
    }
    NSString *json = [NSString stringWithUTF8String:result];
    p_proxy_free_string(result);
    resolve(json ? json : @"");
}

@end
