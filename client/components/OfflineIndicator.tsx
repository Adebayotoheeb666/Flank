import { useState, useEffect } from "react";
import { Wifi, WifiOff, HardDrive, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { onOnlineStatusChange, getCacheInfo } from "@/lib/service-worker";

interface CacheInfo {
  name: string;
  count: number;
}

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [storageUsage, setStorageUsage] = useState<string>("");

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen to online/offline changes
    const unsubscribe = onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        // Auto-hide after 3 seconds when coming back online
        setTimeout(() => setShowDetails(false), 3000);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update cache info when shown
    if (showDetails) {
      getCacheInfo().then(setCacheInfo);

      // Get storage estimate
      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then((estimate) => {
          const used = (estimate.usage || 0) / (1024 * 1024); // MB
          const quota = (estimate.quota || 0) / (1024 * 1024); // MB
          setStorageUsage(`${used.toFixed(1)}MB / ${quota.toFixed(1)}MB`);
        });
      }
    }
  }, [showDetails]);

  if (isOnline && !showDetails) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">No Internet Connection</p>
              <p className="text-xs opacity-80">Using cached data and offline mode</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-bold underline hover:no-underline"
          >
            {showDetails ? "Hide" : "Details"}
          </button>
        </div>
      )}

      {/* Status Bar - Always visible on offline or when expanded */}
      {(showDetails || !isOnline) && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-sm transition-all duration-300",
            isOnline
              ? "bg-green-50/80 border-green-200"
              : "bg-yellow-50/80 border-yellow-200"
          )}
        >
          <div className="container py-3 space-y-3">
            {/* Status Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-900">Connected</span>
                    </div>
                    <span className="text-xs text-green-700">App fully functional</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <WifiOff className="h-4 w-4 text-yellow-600 animate-pulse" />
                      <span className="text-sm font-semibold text-yellow-900">Offline Mode</span>
                    </div>
                    <span className="text-xs text-yellow-700">Using cached data</span>
                  </>
                )}
              </div>

              {showDetails && (
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Cache Details */}
            {showDetails && (
              <div className="space-y-2 pt-2 border-t">
                {/* Cache Summary */}
                <div className="bg-background/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Cached Data</span>
                  </div>

                  {cacheInfo.length > 0 ? (
                    <div className="space-y-1 ml-6">
                      {cacheInfo.map((cache) => (
                        <div
                          key={cache.name}
                          className="text-xs text-muted-foreground flex justify-between"
                        >
                          <span>{cache.name.replace(/^futa-[^-]+-/, "")}</span>
                          <span className="font-mono">{cache.count} items</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground ml-6">No cached data yet</p>
                  )}

                  {storageUsage && (
                    <div className="text-xs text-muted-foreground mt-2 ml-6">
                      <p>Storage: {storageUsage}</p>
                    </div>
                  )}
                </div>

                {/* Features Available Offline */}
                <div className="bg-background/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Available Offline</span>
                  </div>
                  <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                    <li>✓ View cached map locations</li>
                    <li>✓ Access your course schedule</li>
                    <li>✓ Review freshers guide</li>
                    <li>✓ Emergency contact information</li>
                    <li>✗ Real-time navigation updates</li>
                    <li>✗ Search & new location data</li>
                  </ul>
                </div>

                {/* Helpful Tip */}
                {!isOnline && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-xs text-yellow-900">
                      <strong>💡 Tip:</strong> The app has cached essential features. When you're back online,
                      all features will be available automatically.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom padding when offline indicator is visible */}
      {(showDetails || !isOnline) && (
        <div className="h-[200px] md:h-[150px]" />
      )}
    </>
  );
}
