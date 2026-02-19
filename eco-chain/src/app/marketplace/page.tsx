"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseEther } from "viem";
import {
    ShoppingBag,
    Search,
    Filter,
    TreePine,
    Wind,
    Factory,
    Leaf,
    TrendingUp,
    Clock,
    MapPin,
    ArrowUpDown,
    Loader2,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MARKETPLACE_ABI } from "@/lib/contracts";
import { MARKETPLACE_ADDRESS, areContractsConfigured } from "@/lib/wagmi";

// Type icons by project type
const typeIcons: Record<string, typeof TreePine> = {
    reforestation: TreePine,
    conservation: Leaf,
    renewable: Wind,
    industrial: Factory,
};

interface MarketplaceListing {
    tokenId: number;
    availableSupply: string;
    totalSupply: string;
    pricePerTon: string;
    projectName: string;
    projectDescription: string | null;
    metadata: {
        location?: { lat: number; lng: number };
        country?: string;
        projectType?: string;
        methodology?: string;
        vintage?: string;
    } | null;
    verificationStatus: string;
    ownerWallet: string;
}

const SAMPLE_LISTINGS: MarketplaceListing[] = [
    {
        tokenId: 1,
        availableSupply: "420.0",
        totalSupply: "1200.0",
        pricePerTon: "2.40",
        projectName: "Amazon Rainforest Conservation",
        projectDescription: "Community-led avoided deforestation program.",
        metadata: {
            country: "Brazil",
            projectType: "conservation",
            methodology: "REDD+",
            vintage: "2024",
            location: { lat: -3.4653, lng: -62.2159 },
        },
        verificationStatus: "verified",
        ownerWallet: "0x9a58a4a7b37e22f0f0f4f8b6a4d6a36bc7f2f123",
    },
    {
        tokenId: 2,
        availableSupply: "310.0",
        totalSupply: "900.0",
        pricePerTon: "2.95",
        projectName: "Borneo Reforestation",
        projectDescription: "Native-species restoration with long-term monitoring.",
        metadata: {
            country: "Indonesia",
            projectType: "reforestation",
            methodology: "ARR",
            vintage: "2023",
            location: { lat: 1.8, lng: 109.95 },
        },
        verificationStatus: "verified",
        ownerWallet: "0xb153d2b8cb0ec33fc910d210afcb9f4ca9c2e0d8",
    },
    {
        tokenId: 3,
        availableSupply: "680.0",
        totalSupply: "1500.0",
        pricePerTon: "1.85",
        projectName: "Kenya Wind Corridor",
        projectDescription: "Grid-scale wind generation replacing diesel demand.",
        metadata: {
            country: "Kenya",
            projectType: "renewable",
            methodology: "ACM0002",
            vintage: "2025",
            location: { lat: 2.2, lng: 37.9 },
        },
        verificationStatus: "verified",
        ownerWallet: "0x4e6f43f11ccf1d97899ce12f39de9a615cb34e41",
    },
    {
        tokenId: 4,
        availableSupply: "220.0",
        totalSupply: "700.0",
        pricePerTon: "3.75",
        projectName: "Nordic Carbon Capture Hub",
        projectDescription: "Industrial capture and verified geological storage.",
        metadata: {
            country: "Norway",
            projectType: "industrial",
            methodology: "CCS",
            vintage: "2025",
            location: { lat: 60.47, lng: 8.46 },
        },
        verificationStatus: "verified",
        ownerWallet: "0x0f2f42e8444fdc8f4f4d5ed3e69c2e4b4c2f8aa0",
    },
];

export default function MarketplacePage() {
    const { isConnected } = useAccount();
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState("price-low");
    const [buyAmounts, setBuyAmounts] = useState<Record<number, string>>({});
    const [listings] = useState<MarketplaceListing[]>(SAMPLE_LISTINGS);
    const [isLoading] = useState(false);

    const contractsReady = areContractsConfigured();

    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isTxPending } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    const filtered = listings
        .filter((l) => {
            const projectType =
                (l.metadata as Record<string, unknown>)?.projectType || "";
            const country =
                (l.metadata as Record<string, unknown>)?.country || "";
            const matchesSearch =
                l.projectName.toLowerCase().includes(search.toLowerCase()) ||
                String(country).toLowerCase().includes(search.toLowerCase());
            const matchesType =
                filterType === "all" ||
                String(projectType)
                    .toLowerCase()
                    .includes(filterType.toLowerCase());
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === "price-low")
                return parseFloat(a.pricePerTon) - parseFloat(b.pricePerTon);
            if (sortBy === "price-high")
                return parseFloat(b.pricePerTon) - parseFloat(a.pricePerTon);
            if (sortBy === "supply")
                return (
                    parseFloat(b.availableSupply) - parseFloat(a.availableSupply)
                );
            return 0;
        });

    const marketStats = [
        {
            label: "Live Listings",
            value: filtered.length.toLocaleString(),
        },
        {
            label: "Available Supply",
            value: `${Math.round(
                filtered.reduce(
                    (sum, listing) => sum + parseFloat(listing.availableSupply),
                    0
                )
            ).toLocaleString()} tCO2`,
        },
        {
            label: "Avg Price",
            value: filtered.length
                ? `${(
                    filtered.reduce(
                        (sum, listing) => sum + parseFloat(listing.pricePerTon),
                        0
                    ) / filtered.length
                ).toFixed(2)} MATIC`
                : "--",
        },
        {
            label: "Countries",
            value: new Set(
                filtered.map((listing) =>
                    String((listing.metadata as Record<string, unknown>)?.country || "Unknown")
                )
            ).size.toString(),
        },
    ];

    const { openConnectModal } = useConnectModal();

    const handleBuy = (listing: MarketplaceListing) => {
        if (!isConnected) {
            openConnectModal?.();
            return;
        }

        if (!contractsReady) {
            toast.error("Contracts not deployed yet");
            return;
        }

        const amount = parseInt(buyAmounts[listing.tokenId] || "1");
        if (
            !amount ||
            amount <= 0 ||
            amount > parseFloat(listing.availableSupply)
        ) {
            toast.error("Invalid amount");
            return;
        }

        // Use string math to avoid floating-point precision issues
        const priceWei = parseEther(listing.pricePerTon);
        const totalPrice = priceWei * BigInt(amount);

        writeContract(
            {
                address: MARKETPLACE_ADDRESS,
                abi: MARKETPLACE_ABI,
                functionName: "buy",
                args: [BigInt(listing.tokenId), BigInt(amount)],
                value: totalPrice,
            },
            {
                onSuccess: () => {
                    toast.success(
                        `Purchased ${amount} credits from ${listing.projectName}!`
                    );
                    setBuyAmounts((prev) => {
                        const updated = { ...prev };
                        delete updated[listing.tokenId];
                        return updated;
                    });
                },
                onError: (error) => {
                    toast.error(error.message.slice(0, 100));
                },
            }
        );
    };

    return (
        <div className="min-h-screen bg-grid">
            <div className="border-b border-border/70 bg-card/60 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                        <div className="space-y-6">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs text-primary">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Dynamic pricing and instant settlement
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-surge-orange to-surge-orange-dark">
                                        <ShoppingBag className="h-5 w-5 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-foreground">
                                        Marketplace
                                    </h1>
                                </div>
                                <p className="text-muted-foreground">
                                    Browse and purchase verified carbon credits from projects worldwide.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {["all", "conservation", "reforestation", "renewable", "industrial"].map((type) => (
                                    <Button
                                        key={type}
                                        variant="ghost"
                                        size="sm"
                                        className={`rounded-full border ${filterType === type
                                            ? "border-primary/40 bg-primary/12 text-primary"
                                            : "border-border/60 bg-background/55 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            }`}
                                        onClick={() => setFilterType(type)}
                                    >
                                        {type === "all"
                                            ? "All types"
                                            : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search projects or countries..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-10 pl-10 bg-background/70 border-border focus-visible:border-primary/60"
                                    />
                                </div>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-full sm:w-48 bg-background/70 border-border">
                                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="conservation">Conservation</SelectItem>
                                        <SelectItem value="reforestation">Reforestation</SelectItem>
                                        <SelectItem value="renewable">Renewable Energy</SelectItem>
                                        <SelectItem value="industrial">Industrial</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-full sm:w-48 bg-background/70 border-border">
                                        <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                                        <SelectItem value="supply">Largest Supply</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {marketStats.map((stat) => (
                                <div key={stat.label} className="eco-surface eco-ring-hover rounded-2xl p-4">
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    <p className="mt-1 text-lg font-semibold text-foreground">
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Listings Grid ─── */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="eco-surface rounded-2xl flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mb-4 text-muted-foreground/70" />
                        <p className="text-lg font-medium">No listings found</p>
                        <p className="text-sm text-muted-foreground/85 mt-1">
                            {listings.length === 0
                                ? "No verified projects are listed yet. Submit a project to get started."
                                : "Try adjusting your search or filters."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-muted-foreground">
                            {filtered.length} project
                            {filtered.length !== 1 ? "s" : ""} found
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((listing) => {
                                const metadata = listing.metadata as Record<string, unknown> | null;
                                const projectType = String(metadata?.projectType || "conservation");
                                const country = String(metadata?.country || "Unknown");
                                const methodology = String(metadata?.methodology || "");
                                const vintage = String(metadata?.vintage || "");
                                const Icon = typeIcons[projectType] || Leaf;

                                return (
                                    <Card
                                        key={listing.tokenId}
                                        className="group eco-surface eco-ring-hover relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                                    >
                                        <div className="absolute top-4 right-4 z-10">
                                            <Badge
                                                variant="secondary"
                                                className="border-primary/25 bg-primary/10 text-primary text-xs"
                                            >
                                                {projectType}
                                            </Badge>
                                        </div>


                                        <CardHeader className="pb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                                                    <Icon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                                                        {listing.projectName}
                                                    </h3>
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3" />
                                                        {country}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 pb-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-lg bg-background/70 border border-border/70 px-3 py-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        Price/ton
                                                    </div>
                                                    <div className="text-sm font-semibold text-primary">
                                                        {listing.pricePerTon} MATIC
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-background/70 border border-border/70 px-3 py-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        Available
                                                    </div>
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {parseFloat(listing.availableSupply).toLocaleString()} t
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-2 rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-surge-orange to-surge-orange-dark"
                                                    style={{
                                                        width: `${Math.max(
                                                            8,
                                                            Math.min(
                                                                100,
                                                                (parseFloat(listing.availableSupply) /
                                                                    parseFloat(listing.totalSupply || "1")) *
                                                                100
                                                            )
                                                        )}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                {vintage && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Vintage {vintage}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" />
                                                    Verified
                                                </div>
                                            </div>

                                            {methodology && (
                                                <div className="text-xs text-muted-foreground/80 truncate">
                                                    {methodology}
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex gap-2 border-t border-border/70 pt-4">
                                            <Input
                                                type="number"
                                                min="1"
                                                max={parseFloat(listing.availableSupply)}
                                                placeholder="Qty"
                                                value={buyAmounts[listing.tokenId] || ""}
                                                onChange={(e) =>
                                                    setBuyAmounts({
                                                        ...buyAmounts,
                                                        [listing.tokenId]: e.target.value,
                                                    })
                                                }
                                                className="w-24 bg-background/70 border-border text-sm"
                                            />
                                            <Button
                                                className="flex-1 bg-gradient-to-r from-surge-orange to-surge-orange-dark text-white font-medium text-sm transition-transform hover:scale-[1.01] hover:from-surge-orange-dark hover:to-surge-orange-dark"
                                                disabled={
                                                    isTxPending ||
                                                    (isConnected && !contractsReady)
                                                }
                                                onClick={() => handleBuy(listing)}
                                            >
                                                {!isConnected
                                                    ? "Connect Wallet"
                                                    : !contractsReady
                                                        ? "Contracts Not Deployed"
                                                        : isTxPending
                                                            ? "Pending..."
                                                            : "Buy Credits"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
