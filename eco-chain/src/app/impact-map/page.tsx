"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Globe, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Dynamic import for Leaflet (SSR-incompatible)
const MapContainer = dynamic(
    () => import("react-leaflet").then((m) => m.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((m) => m.TileLayer),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import("react-leaflet").then((m) => m.CircleMarker),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((m) => m.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((m) => m.Popup),
    { ssr: false }
);

// We need to import leafet types dynamically or use a type assertion to create custom icons
let L: any;
if (typeof window !== "undefined") {
    L = require("leaflet");
}

interface ProjectLocation {
    id: number;
    name: string;
    lat: number;
    lng: number;
    country: string;
    projectType: string;
    status: string;
}

// Fallback demo data when DB is empty
const DEMO_PROJECTS: ProjectLocation[] = [
    {
        id: 1,
        name: "Amazon Rainforest Conservation",
        lat: -3.4653,
        lng: -62.2159,
        country: "Brazil",
        projectType: "Conservation",
        status: "verified",
    },
    {
        id: 2,
        name: "Borneo Reforestation",
        lat: 1.8,
        lng: 109.95,
        country: "Indonesia",
        projectType: "Reforestation",
        status: "verified",
    },
    {
        id: 3,
        name: "Sahara Solar Farm",
        lat: 30.0,
        lng: 2.0,
        country: "Algeria",
        projectType: "Renewable Energy",
        status: "verified",
    },
    {
        id: 4,
        name: "Kenya Wind Corridor",
        lat: 2.2,
        lng: 37.9,
        country: "Kenya",
        projectType: "Renewable Energy",
        status: "verified",
    },
    {
        id: 5,
        name: "Nordic Carbon Capture Hub",
        lat: 60.47,
        lng: 8.46,
        country: "Norway",
        projectType: "Industrial Capture",
        status: "verified",
    },
];

export default function ImpactMapPage() {
    const [selectedProject, setSelectedProject] = useState<ProjectLocation | null>(null);
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isClient = typeof window !== "undefined" && mounted;
    const isDark = (resolvedTheme ?? "light") !== "light";

    // Use demo data for now — will be replaced with DB fetch
    const projectLocations = useMemo<ProjectLocation[]>(() => DEMO_PROJECTS, []);

    // Create custom pulsating icon function
    const createCustomIcon = (isSelected: boolean) => {
        if (!isClient) return undefined;
        return L.divIcon({
            className: "bg-transparent",
            html: `
                <div class="relative flex h-6 w-6 items-center justify-center">
                    <span class="absolute inline-flex h-full w-full rounded-full bg-surge-orange/50 ${isSelected ? 'animate-pulse' : 'animate-ping opacity-75'}"></span>
                    <span class="relative inline-flex h-3 w-3 rounded-full bg-surge-orange-dark shadow-[0_0_8px_rgba(224,120,80,0.8)] border border-white/50"></span>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    };

    return (
        <div className="min-h-screen bg-grid">
            <div className="border-b border-border/70 bg-card/60 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
                            <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Impact Map
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Explore verified carbon offset projects around the world
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-4">
                    {/* ─── Sidebar: Project List ─── */}
                    <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            {projectLocations.length} Projects
                        </p>

                        {projectLocations.map((project, index) => (
                            <Card
                                key={project.id}
                                className={`cursor-pointer border transition-all duration-300 transform eco-ring-hover hover:-translate-y-1 animate-fade-in-up ${selectedProject?.id === project.id
                                    ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(224,120,80,0.15)] scale-[1.02]"
                                    : "eco-surface border-border/70 hover:border-primary/40 hover:shadow-md"
                                    }`}
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => setSelectedProject(project)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-medium text-foreground truncate">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {project.country}
                                            </div>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 text-[10px] bg-primary/10 text-primary border-primary/25"
                                        >
                                            {project.projectType}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-surge-orange">
                                        <CheckCircle className="h-3 w-3" />
                                        Verified
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="lg:col-span-3 rounded-xl overflow-hidden border border-border/70 bg-card/80">
                        {!isClient ? (
                            <div className="h-[600px] flex items-center justify-center eco-surface rounded-xl">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="animate-fade-in-up delay-300 rounded-xl overflow-hidden h-full">
                                {/* Load Leaflet CSS */}
                                <link
                                    rel="stylesheet"
                                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                                    crossOrigin=""
                                />
                                <MapContainer
                                    center={[20, 0]}
                                    zoom={3}
                                    scrollWheelZoom={true}
                                    style={{ height: "600px", width: "100%", background: isDark ? "#1a1a1a" : "#faf7f5" }}
                                    className="z-0"
                                >
                                    <TileLayer
                                        url={
                                            isDark
                                                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                        }
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    />
                                    {projectLocations.map((project) => (
                                        <Marker
                                            key={project.id}
                                            position={[project.lat, project.lng]}
                                            icon={createCustomIcon(selectedProject?.id === project.id)}
                                            eventHandlers={{
                                                click: () =>
                                                    setSelectedProject(project),
                                            }}
                                        >
                                            <Popup className="custom-popup">
                                                <div className="text-sm rounded-lg p-1">
                                                    <strong className="text-surge-orange-dark block mb-1">{project.name}</strong>
                                                    <div className="text-muted-foreground text-xs font-mono">{project.country} — {project.projectType}</div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
