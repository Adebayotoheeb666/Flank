import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineStatus() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
                >
                    <div className="bg-amber-600 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/50 backdrop-blur-md flex items-center gap-4">
                        <div className="bg-amber-500/20 p-2 rounded-xl">
                            <WifiOff className="h-6 w-6 text-amber-100 animate-pulse" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Offline Mode Active</p>
                            <p className="text-xs text-amber-100">Using cached maps and data. Some features may be limited.</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
