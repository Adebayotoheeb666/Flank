import { useState, useEffect, useMemo } from "react";
import { Location } from "@shared/api";

export function useOfflineSearch() {
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                // Fetch all locations for local indexing
                const response = await fetch("/api/locations");
                if (response.ok) {
                    const data = await response.json();
                    setAllLocations(data);
                    // Cache in localStorage for immediate offline availability on next load
                    localStorage.setItem("futa_locations_cache", JSON.stringify(data));
                }
            } catch (error) {
                console.error("Offline search fetch error:", error);
                // Fallback to cache if network fails
                const cached = localStorage.getItem("futa_locations_cache");
                if (cached) {
                    setAllLocations(JSON.parse(cached));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    const searchLocations = (query: string, category: string = "all") => {
        if (!query && category === "all") return allLocations;

        return allLocations.filter(loc => {
            const matchesQuery = !query ||
                loc.name.toLowerCase().includes(query.toLowerCase()) ||
                loc.description.toLowerCase().includes(query.toLowerCase()) ||
                loc.type.toLowerCase().includes(query.toLowerCase());

            const matchesCategory = category === "all" || loc.category === category;

            return matchesQuery && matchesCategory;
        });
    };

    return { allLocations, searchLocations, loading };
}
