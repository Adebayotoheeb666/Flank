import { useState, useEffect } from "react";
import { RouteResponse } from "@shared/navigation";
import { Location } from "@shared/api";

const NAV_STORAGE_KEY = "futa_nav_state";

interface NavState {
    selectedLocation: Location | null;
    isNavigating: boolean;
    route: RouteResponse | null;
    preferFlat: boolean;
    lastUpdated: number;
}

export function usePersistentNavigation() {
    const [navState, setNavState] = useState<NavState>(() => {
        const saved = localStorage.getItem(NAV_STORAGE_KEY);
        if (saved) {
            try {
                const parsed: NavState = JSON.parse(saved);
                // Only restore if state is less than 4 hours old (campus navigation is ephemeral)
                if (Date.now() - parsed.lastUpdated < 1000 * 60 * 60 * 4) {
                    return parsed;
                }
            } catch (e) {
                console.error("Failed to parse saved nav state", e);
            }
        }
        return {
            selectedLocation: null,
            isNavigating: false,
            route: null,
            preferFlat: false,
            lastUpdated: Date.now(),
        };
    });

    useEffect(() => {
        localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({
            ...navState,
            lastUpdated: Date.now()
        }));
    }, [navState]);

    const updateNavState = (updates: Partial<NavState>) => {
        setNavState(prev => ({
            ...prev,
            ...updates
        }));
    };

    const clearNavState = () => {
        setNavState({
            selectedLocation: null,
            isNavigating: false,
            route: null,
            preferFlat: false,
            lastUpdated: Date.now(),
        });
        localStorage.removeItem(NAV_STORAGE_KEY);
    };

    return {
        ...navState,
        updateNavState,
        clearNavState
    };
}
