#import "ProxyBridge.h"
#import "proxy_ffi.h"

static ProxyBridge *sharedInstance = nil;

static void logCallback(int level, const char *message) {
    if (sharedInstance && message) {
        NSString *msg = [NSString stringWithUTF8String:message];
        [sharedInstance sendEventWithName:@"ProxyLog"
                                     body:@{@"level": @(level), @"message": msg}];
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
        proxy_set_log_callback(logCallback);
        proxy_init_logging();
        _handle = proxy_create();
    }
    return self;
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
                  resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    ProxyConfig config = {
        .server_host = [host UTF8String],
        .server_port = (uint16_t)port,
        .local_port = (uint16_t)lPort,
        .session_key = [key UTF8String],
        .auto_proxy = autoProxyEnabled ? 1 : 0,
        .reverse_geo = rev ? 1 : 0
    };
    ProxyResult result = proxy_start(_handle, &config);
    resolve(@(result == PROXY_OK));
}

RCT_EXPORT_METHOD(stop:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@(proxy_stop(_handle) == PROXY_OK));
}

RCT_EXPORT_METHOD(isRunning:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@(proxy_is_running(_handle) != 0));
}

@end
