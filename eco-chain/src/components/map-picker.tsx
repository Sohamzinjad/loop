"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { MapPin } from "lucide-react";

interface MapPickerProps {
    lat?: number;
    lng?: number;
    onSelect: (lat: number, lng: number) => void;
}

function toFiniteCoordinate(value: unknown): number | null {
    if (typeof value !== "number") return null;
    return Number.isFinite(value) ? value : null;
}

export default function MapPicker({ lat, lng, onSelect }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const leafletLibRef = useRef<typeof L | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        let isCancelled = false;
        const container = mapRef.current;

        // Load Leaflet dynamically (SSR safe)
        const loadLeaflet = async () => {
            const L = (await import("leaflet")).default;
            leafletLibRef.current = L;

            if (isCancelled || leafletMapRef.current || !container.isConnected) {
                return;
            }

            // Fix default marker icon
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });

            // React Strict Mode can leave a stale Leaflet marker on the same container in dev.
            const mapElement = container as HTMLDivElement & { _leaflet_id?: number };
            if (mapElement._leaflet_id) {
                delete mapElement._leaflet_id;
            }

            const initialLat = toFiniteCoordinate(lat);
            const initialLng = toFiniteCoordinate(lng);
            const hasInitialCoords =
                initialLat !== null && initialLng !== null;

            const map = L.map(container, {
                center: hasInitialCoords ? [initialLat, initialLng] : [20, 0],
                zoom: hasInitialCoords ? 6 : 2,
                zoomControl: true,
                attributionControl: false,
            });

            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                { maxZoom: 18 }
            ).addTo(map);

            // Add marker if coords exist
            if (hasInitialCoords) {
                markerRef.current = L.marker([initialLat, initialLng]).addTo(map);
            }

            // Click to place marker
            map.on("click", (e: L.LeafletMouseEvent) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;
                if (!Number.isFinite(clickLat) || !Number.isFinite(clickLng)) {
                    return;
                }

                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng]);
                } else {
                    markerRef.current = L.marker([clickLat, clickLng]).addTo(
                        map
                    );
                }

                onSelect(clickLat, clickLng);
            });

            if (isCancelled) {
                map.remove();
                return;
            }

            leafletMapRef.current = map;
            setIsLoaded(true);
        };

        loadLeaflet();

        return () => {
            isCancelled = true;
            if (leafletMapRef.current) {
                leafletMapRef.current.off();
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
                markerRef.current = null;
            }
            setIsLoaded(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update marker when lat/lng props change externally
    useEffect(() => {
        if (!leafletMapRef.current || !isLoaded) return;
        const safeLat = toFiniteCoordinate(lat);
        const safeLng = toFiniteCoordinate(lng);
        const hasValidCoords = safeLat !== null && safeLng !== null;

        if (!hasValidCoords) {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            return;
        }

        const L = leafletLibRef.current;
        if (!L) return;

        try {
            if (markerRef.current) {
                markerRef.current.setLatLng([safeLat, safeLng]);
            } else {
                markerRef.current = L.marker([safeLat, safeLng]).addTo(
                    leafletMapRef.current
                );
            }
            leafletMapRef.current.setView([safeLat, safeLng], 6);
        } catch {
            // Defensive fallback: stale or malformed coordinates should not crash UI.
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        }
    }, [lat, lng, isLoaded]);

    return (
        <div className="relative">
            {/* Leaflet CSS */}
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                crossOrigin=""
            />

            <div
                ref={mapRef}
                className="h-48 w-full rounded-lg border border-emerald-900/30 z-0"
                style={{ background: "#060a08" }}
            />

            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#060a08]/80">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <MapPin className="h-4 w-4 animate-pulse" />
                        Loading map...
                    </div>
                </div>
            )}
        </div>
    );
}
