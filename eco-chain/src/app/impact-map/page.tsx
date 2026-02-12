"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin, TreePine, Wind, Factory, Leaf, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Dynamic import for Leaflet (SSR-incompatible)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const MarkerComponent = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

// Mock project locations
const projectLocations = [
    {
        id: 1,
        name: "Amazon Rainforest Conservation",
        lat: -3.4653,
        lng: -62.2159,
        type: "Conservation",
        icon: Leaf,
        credits: 8500,
        retired: 2100,
        country: "Brazil",
    },
    {
        id: 2,
        name: "Saharan Solar Farm Grid",
        lat: 31.7917,
        lng: -7.0926,
        type: "Renewable Energy",
        icon: Wind,
        credits: 12000,
        retired: 4500,
        country: "Morocco",
    },
    {
        id: 3,
        name: "Nordic Direct Air Capture",
        lat: 64.1466,
        lng: -21.9426,
        type: "Industrial",
        icon: Factory,
        credits: 3200,
        retired: 800,
        country: "Iceland",
    },
    {
        id: 4,
        name: "Borneo Mangrove Restoration",
        lat: 1.6,
        lng: 110.3,
        type: "Reforestation",
        icon: TreePine,
        credits: 6400,
        retired: 1900,
        country: "Indonesia",
    },
    {
        id: 5,
        name: "Patagonia Wind Energy",
        lat: -46.5,
        lng: -71.5,
        type: "Renewable Energy",
        icon: Wind,
        credits: 9500,
        retired: 3200,
        country: "Argentina",
    },
    {
        id: 6,
        name: "Congo Basin Forest Protection",
        lat: -0.2,
        lng: 21.4,
        type: "Conservation",
        icon: Leaf,
        credits: 15000,
        retired: 5800,
        country: "DRC Congo",
    },
    {
        id: 7,
        name: "Mumbai Urban Green Corridor",
        lat: 19.076,
        lng: 72.8777,
        type: "Urban Greening",
        icon: TreePine,
        credits: 500,
        retired: 0,
        country: "India",
    },
];

const typeColors: Record<string, string> = {
    Conservation: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Renewable Energy": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    Industrial: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    Reforestation: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    "Urban Greening": "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ImpactMapPage() {
    const [selectedProject, setSelectedProject] = useState<(typeof projectLocations)[0] | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Check if we're on the client
    useState(() => {
        setIsClient(true);
    });

    const totalCredits = projectLocations.reduce((a, p) => a + p.credits, 0);
    const totalRetired = projectLocations.reduce((a, p) => a + p.retired, 0);

    return (
        <div className="min-h-screen bg-grid">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-100">Impact Map</h1>
                        </div>
                        <p className="text-sm text-zinc-500">Explore verified carbon offset projects around the world.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-xs text-zinc-500">Total Issued</p>
                            <p className="text-lg font-bold gradient-text">{totalCredits.toLocaleString()} t</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500">Total Retired</p>
                            <p className="text-lg font-bold text-orange-400">{totalRetired.toLocaleString()} t</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* ─── Map ─── */}
                    <div className="lg:col-span-3">
                        <Card className="border-emerald-900/20 bg-[#0a1210]/80 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="h-[600px] w-full relative">
                                    {isClient && (
                                        <link
                                            rel="stylesheet"
                                            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                                        />
                                    )}
                                    {isClient ? (
                                        <MapContainer
                                            center={[20, 0]}
                                            zoom={2}
                                            style={{ height: "100%", width: "100%", background: "#0a1210" }}
                                            scrollWheelZoom={true}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://carto.com">CARTO</a>'
                                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                            />
                                            {projectLocations.map((project) => (
                                                <MarkerComponent
                                                    key={project.id}
                                                    position={[project.lat, project.lng]}
                                                    eventHandlers={{
                                                        click: () => setSelectedProject(project),
                                                    }}
                                                >
                                                    <Popup>
                                                        <div className="text-sm">
                                                            <strong>{project.name}</strong>
                                                            <br />
                                                            {project.country} • {project.credits.toLocaleString()} tons
                                                        </div>
                                                    </Popup>
                                                </MarkerComponent>
                                            ))}
                                        </MapContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-500">
                                            <p>Loading map...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ─── Sidebar ─── */}
                    <div className="space-y-4">
                        <Card className="border-emerald-900/20 bg-[#0a1210]/80">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Projects ({projectLocations.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                                {projectLocations.map((project) => {
                                    const isSelected = selectedProject?.id === project.id;
                                    const Icon = project.icon;
                                    return (
                                        <button
                                            key={project.id}
                                            onClick={() => setSelectedProject(project)}
                                            className={`w-full text-left rounded-lg border px-3 py-3 transition-all duration-200 ${isSelected
                                                    ? "border-emerald-500/40 bg-emerald-500/10"
                                                    : "border-emerald-900/20 bg-[#060a08]/60 hover:border-emerald-500/20"
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <Icon className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-zinc-200 truncate">{project.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-zinc-500">{project.country}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[10px] px-1.5 py-0 ${typeColors[project.type] || ""}`}
                                                        >
                                                            {project.type}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                                                        <span className="text-emerald-400">{project.credits.toLocaleString()} t</span>
                                                        <span className="text-orange-400">{project.retired.toLocaleString()} retired</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
