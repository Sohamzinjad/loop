"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import dynamic from "next/dynamic";
import {
    BarChart3,
    PlusCircle,
    Wallet,
    CheckCircle2,
    TreePine,
    TrendingUp,
    Flame,
    Package,
    Loader2,
    MapPin,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { submitProject } from "@/actions/projects";
import { buildProjectSubmissionMessage } from "@/lib/auth";

// Dynamic import for map picker (SSR incompatible)
const MapPickerComponent = dynamic(() => import("@/components/map-picker"), {
    ssr: false,
    loading: () => (
        <div className="h-48 rounded-lg bg-background/70 border border-border flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-surge-orange" />
        </div>
    ),
});

interface DemoCredit {
    tokenId: number;
    projectName: string;
    projectType: "reforestation" | "conservation" | "renewable" | "industrial";
    balance: number;
    pricePerTon: number;
}

interface DemoProject {
    id: number;
    name: string;
    type: "reforestation" | "conservation" | "renewable" | "industrial";
    country: string;
    status: "pending" | "verified" | "rejected";
    submittedAt: string;
}

const DEMO_CREDITS: DemoCredit[] = [
    {
        tokenId: 1,
        projectName: "Amazon Rainforest Conservation",
        projectType: "conservation",
        balance: 120,
        pricePerTon: 2.4,
    },
    {
        tokenId: 3,
        projectName: "Kenya Wind Corridor",
        projectType: "renewable",
        balance: 75,
        pricePerTon: 1.85,
    },
    {
        tokenId: 4,
        projectName: "Nordic Carbon Capture Hub",
        projectType: "industrial",
        balance: 28,
        pricePerTon: 3.75,
    },
];

const DEMO_PROJECTS: DemoProject[] = [
    {
        id: 101,
        name: "Borneo Mangrove Restoration",
        type: "reforestation",
        country: "Indonesia",
        status: "verified",
        submittedAt: "2026-01-12",
    },
    {
        id: 102,
        name: "Atacama Solar Storage",
        type: "renewable",
        country: "Chile",
        status: "pending",
        submittedAt: "2026-02-02",
    },
    {
        id: 103,
        name: "Alpine Carbon Removal Pilot",
        type: "industrial",
        country: "Switzerland",
        status: "rejected",
        submittedAt: "2026-01-20",
    },
];

function parseCoordinate(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const { signMessageAsync, isPending: isSigning } = useSignMessage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const submitLockRef = useRef(false); // Double-submit prevention

    const [projectForm, setProjectForm] = useState({
        name: "",
        description: "",
        type: "",
        country: "",
        lat: "",
        lng: "",
        apiEndpoint: "",
    });

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const demoRetired = 64;
    const totalCredits = DEMO_CREDITS.reduce((sum, item) => sum + item.balance, 0);
    const portfolioValue = DEMO_CREDITS.reduce(
        (sum, item) => sum + item.balance * item.pricePerTon,
        0
    );

    const updateField = useCallback(
        (field: string, value: string) => {
            setProjectForm((prev) => ({ ...prev, [field]: value }));
            // Clear field error on change
            if (fieldErrors[field]) {
                setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[field];
                    return next;
                });
            }
        },
        [fieldErrors]
    );

    // Map click handler
    const handleMapClick = useCallback(
        (lat: number, lng: number) => {
            setProjectForm((prev) => ({
                ...prev,
                lat: lat.toFixed(4),
                lng: lng.toFixed(4),
            }));
            // Clear coordinate errors
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.lat;
                delete next.lng;
                return next;
            });
        },
        []
    );

    // Client-side validation
    const validate = (): boolean => {
        const errors: Record<string, string> = {};

        if (!projectForm.name || projectForm.name.trim().length < 3) {
            errors.name = "Name must be at least 3 characters";
        }
        if (!projectForm.type) {
            errors.type = "Please select a project type";
        }
        if (projectForm.apiEndpoint) {
            try {
                const url = new URL(projectForm.apiEndpoint);
                if (url.protocol !== "https:") {
                    errors.apiEndpoint = "Must be an HTTPS URL";
                }
            } catch {
                errors.apiEndpoint = "Invalid URL format";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitProject = async () => {
        // Double-submit prevention
        if (submitLockRef.current || isSubmitting || isSigning) return;
        if (!validate()) return;

        if (!address) {
            toast.error("Please connect your wallet first");
            return;
        }

        submitLockRef.current = true;
        setIsSubmitting(true);

        try {
            const timestamp = Date.now();
            const message = buildProjectSubmissionMessage(address, timestamp);
            const signature = await signMessageAsync({ message });

            const latValue = parseCoordinate(projectForm.lat);
            const lngValue = parseCoordinate(projectForm.lng);

            const result = await submitProject({
                walletAddress: address,
                name: projectForm.name,
                description: projectForm.description || undefined,
                type: projectForm.type as
                    | "reforestation"
                    | "conservation"
                    | "renewable"
                    | "industrial",
                country: projectForm.country || undefined,
                lat: latValue,
                lng: lngValue,
                apiEndpoint: projectForm.apiEndpoint || undefined,
                signature,
                timestamp,
            });

            if (result.success) {
                toast.success(result.message || "Project submitted!");
                setProjectForm({
                    name: "",
                    description: "",
                    type: "",
                    country: "",
                    lat: "",
                    lng: "",
                    apiEndpoint: "",
                });
                setFieldErrors({});
                setDialogOpen(false);
            } else {
                // Show field-level errors from server
                if (
                    result.details &&
                    typeof result.details === "object"
                ) {
                    const serverErrors: Record<string, string> = {};
                    for (const [key, value] of Object.entries(
                        result.details as Record<string, string[]>
                    )) {
                        serverErrors[key] = Array.isArray(value)
                            ? value[0]
                            : String(value);
                    }
                    setFieldErrors(serverErrors);
                }
                toast.error(result.error || "Failed to submit project");
            }
        } catch (error) {
            if ((error as Error)?.name === "UserRejectedRequestError") {
                toast.error("Signature request was rejected");
            } else {
                toast.error("Network or signature error — please try again");
            }
        } finally {
            setIsSubmitting(false);
            submitLockRef.current = false;
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid">
                <Card className="eco-surface max-w-md w-full border-border/70">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surge-orange/10 border border-surge-orange/20">
                            <Wallet className="h-8 w-8 text-surge-orange" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">
                            Connect Your Wallet
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Connect your wallet to view your dashboard, manage
                            credits, and submit projects.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-grid">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="eco-surface mb-8 rounded-3xl p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                Portfolio and project workflow
                            </p>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-surge-orange to-surge-orange-dark">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Dashboard
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-surge-orange to-surge-orange-dark text-white transition-transform hover:scale-[1.01] hover:from-surge-orange-dark hover:to-surge-orange-dark">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Submit Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-surge-orange/10">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">
                                    Submit New Carbon Project
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Enter project details and location to submit for verification.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">
                                        Project Name{" "}
                                        <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        value={projectForm.name}
                                        onChange={(e) =>
                                            updateField("name", e.target.value)
                                        }
                                        placeholder="e.g. Amazon Reforestation Initiative"
                                        className={`bg-background/70 border-border ${fieldErrors.name
                                                ? "border-red-500/50"
                                                : ""
                                            }`}
                                        maxLength={200}
                                        disabled={isSubmitting}
                                    />
                                    {fieldErrors.name && (
                                        <p className="text-xs text-red-400">
                                            {fieldErrors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">
                                        Description
                                    </Label>
                                    <Textarea
                                        value={projectForm.description}
                                        onChange={(e) =>
                                            updateField(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Describe the project's carbon offset methodology..."
                                        className="bg-background/70 border-border resize-none"
                                        rows={3}
                                        maxLength={2000}
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-muted-foreground/80 text-right">
                                        {projectForm.description.length}/2000
                                    </p>
                                </div>

                                {/* Type + Country */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-foreground">
                                            Project Type{" "}
                                            <span className="text-red-400">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={projectForm.type}
                                            onValueChange={(v) =>
                                                updateField("type", v)
                                            }
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger
                                                className={`bg-background/70 border-border ${fieldErrors.type
                                                        ? "border-red-500/50"
                                                        : ""
                                                    }`}
                                            >
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border">
                                                <SelectItem value="reforestation">
                                                    🌲 Reforestation
                                                </SelectItem>
                                                <SelectItem value="conservation">
                                                    🌿 Conservation
                                                </SelectItem>
                                                <SelectItem value="renewable">
                                                    💨 Renewable Energy
                                                </SelectItem>
                                                <SelectItem value="industrial">
                                                    🏭 Industrial Capture
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.type && (
                                            <p className="text-xs text-red-400">
                                                {fieldErrors.type}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">
                                            Country
                                        </Label>
                                        <Input
                                            value={projectForm.country}
                                            onChange={(e) =>
                                                updateField(
                                                    "country",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. Brazil"
                                            className="bg-background/70 border-border"
                                            maxLength={100}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Map Picker */}
                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        Project Location
                                    </Label>
                                    <p className="text-xs text-muted-foreground/80">
                                        Click on the map to set coordinates, or
                                        enter manually below.
                                    </p>
                                    <MapPickerComponent
                                        lat={parseCoordinate(projectForm.lat)}
                                        lng={parseCoordinate(projectForm.lng)}
                                        onSelect={handleMapClick}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Latitude
                                            </Label>
                                            <Input
                                                value={projectForm.lat}
                                                onChange={(e) =>
                                                    updateField(
                                                        "lat",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="-3.4653"
                                                className="bg-background/70 border-border text-sm"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">
                                                Longitude
                                            </Label>
                                            <Input
                                                value={projectForm.lng}
                                                onChange={(e) =>
                                                    updateField(
                                                        "lng",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="-62.2159"
                                                className="bg-background/70 border-border text-sm"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    {projectForm.lat && projectForm.lng && (
                                        <div className="flex items-center gap-2 text-xs text-surge-orange">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Location set: {projectForm.lat},{" "}
                                            {projectForm.lng}
                                            <button
                                                onClick={() => {
                                                    updateField("lat", "");
                                                    updateField("lng", "");
                                                }}
                                                className="ml-auto text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* IoT Endpoint */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">
                                        IoT/API Endpoint{" "}
                                        <span className="text-muted-foreground/80">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Input
                                        value={projectForm.apiEndpoint}
                                        onChange={(e) =>
                                            updateField(
                                                "apiEndpoint",
                                                e.target.value
                                            )
                                        }
                                        placeholder="https://api.example.com/emissions"
                                        className={`bg-background/70 border-border ${fieldErrors.apiEndpoint
                                                ? "border-red-500/50"
                                                : ""
                                            }`}
                                        disabled={isSubmitting}
                                    />
                                    {fieldErrors.apiEndpoint && (
                                        <p className="text-xs text-red-400">
                                            {fieldErrors.apiEndpoint}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground/80">
                                        Must be HTTPS. Internal/private URLs are
                                        blocked.
                                    </p>
                                </div>

                                {/* Submit */}
                                <Button
                                    onClick={handleSubmitProject}
                                    disabled={isSubmitting || isSigning}
                                    className="w-full bg-gradient-to-r from-surge-orange to-surge-orange-dark hover:from-surge-orange-dark hover:to-surge-orange-dark text-white"
                                >
                                    {isSubmitting || isSigning ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {isSigning ? "Awaiting signature..." : "Submitting..."}
                                        </>
                                    ) : (
                                        "Submit for Verification"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                </div>

                {/* ─── Stats Grid ─── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {[
                        {
                            label: "Total Credits",
                            value: `${totalCredits.toLocaleString()} t`,
                            icon: Package,
                            color: "text-surge-orange",
                        },
                        {
                            label: "Total Retired",
                            value: `${demoRetired.toLocaleString()} t`,
                            icon: Flame,
                            color: "text-orange-400",
                        },
                        {
                            label: "Portfolio Value",
                            value: `${portfolioValue.toFixed(2)} MATIC`,
                            icon: TrendingUp,
                            color: "text-cyan-400",
                        },
                        {
                            label: "Projects",
                            value: DEMO_PROJECTS.length.toString(),
                            icon: TreePine,
                            color: "text-lime-400",
                        },
                    ].map((stat) => (
                        <Card
                            key={stat.label}
                            className="eco-surface eco-ring-hover border-border/70"
                        >
                            <CardContent className="flex items-center gap-4 pt-6">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surge-orange/10 border border-surge-orange/20">
                                    <stat.icon
                                        className={`h-6 w-6 ${stat.color}`}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {stat.label}
                                    </p>
                                    <p className="text-xl font-bold text-foreground">
                                        {stat.value}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ─── Tabs ─── */}
                <Tabs defaultValue="credits" className="space-y-6">
                    <TabsList className="eco-surface border-border/70">
                        <TabsTrigger
                            value="credits"
                            className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary"
                        >
                            My Credits
                        </TabsTrigger>
                        <TabsTrigger
                            value="projects"
                            className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary"
                        >
                            My Projects
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="credits" className="space-y-4">
                        {DEMO_CREDITS.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/80">
                                <Package className="h-12 w-12 mb-3 text-muted-foreground/70" />
                                <p className="text-sm">
                                    Purchase credits from the marketplace to see
                                    them here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {DEMO_CREDITS.map((credit) => (
                                    <Card
                                        key={credit.tokenId}
                                        className="eco-surface eco-ring-hover border-border/70"
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {credit.projectName}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Token #{credit.tokenId}
                                                    </p>
                                                </div>
                                                <Badge className="bg-surge-orange/10 text-surge-orange border border-surge-orange/20 capitalize">
                                                    {credit.projectType}
                                                </Badge>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Balance
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {credit.balance} tCO2
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Est. Value
                                                </span>
                                                <span className="font-semibold text-surge-orange">
                                                    {(credit.balance * credit.pricePerTon).toFixed(2)} MATIC
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        {DEMO_PROJECTS.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/80">
                                <TreePine className="h-12 w-12 mb-3 text-muted-foreground/70" />
                                <p className="text-sm">
                                    Submit a project to see it here. Click
                                    &quot;Submit Project&quot; above.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {DEMO_PROJECTS.map((project) => (
                                    <Card
                                        key={project.id}
                                        className="eco-surface eco-ring-hover border-border/70"
                                    >
                                        <CardContent className="pt-6">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {project.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {project.country} · Submitted {project.submittedAt}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-surge-orange/10 text-surge-orange border border-surge-orange/20 capitalize">
                                                        {project.type}
                                                    </Badge>
                                                    <Badge
                                                        className={`capitalize border ${project.status === "verified"
                                                                ? "bg-surge-orange/10 text-surge-orange border-surge-orange/20"
                                                                : project.status === "pending"
                                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                                            }`}
                                                    >
                                                        {project.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
