"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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

    const handleBuy = (listing: MarketplaceListing) => {
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
            {/* ─── Header ─── */}
            <div className="border-b border-emerald-900/20 bg-[#0a0f0d]/60">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                                    <ShoppingBag className="h-5 w-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-zinc-100">
                                    Marketplace
                                </h1>
                            </div>
                            <p className="text-zinc-500 text-sm">
                                Browse and purchase verified carbon credits from
                                projects worldwide.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input
                                    placeholder="Search projects, locations..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-[#0a1210] border-emerald-900/30 focus:border-emerald-500/50 text-zinc-200 placeholder:text-zinc-600"
                                />
                            </div>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-full sm:w-48 bg-[#0a1210] border-emerald-900/30">
                                    <Filter className="h-4 w-4 mr-2 text-zinc-500" />
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a1210] border-emerald-900/30">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="conservation">Conservation</SelectItem>
                                    <SelectItem value="reforestation">Reforestation</SelectItem>
                                    <SelectItem value="renewable">Renewable Energy</SelectItem>
                                    <SelectItem value="industrial">Industrial</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-48 bg-[#0a1210] border-emerald-900/30">
                                    <ArrowUpDown className="h-4 w-4 mr-2 text-zinc-500" />
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a1210] border-emerald-900/30">
                                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                                    <SelectItem value="supply">Largest Supply</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Listings Grid ─── */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                        <AlertCircle className="h-12 w-12 mb-4 text-zinc-600" />
                        <p className="text-lg font-medium">No listings found</p>
                        <p className="text-sm text-zinc-600 mt-1">
                            {listings.length === 0
                                ? "No verified projects are listed yet. Submit a project to get started."
                                : "Try adjusting your search or filters."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-zinc-500">
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
                                        className="group relative overflow-hidden border-emerald-900/20 bg-[#0a1210]/80 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
                                    >
                                        {/* Type Badge */}
                                        <div className="absolute top-4 right-4 z-10">
                                            <Badge
                                                variant="secondary"
                                                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                                            >
                                                {projectType}
                                            </Badge>
                                        </div>

                                        {/* Gradient Banner */}
                                        <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />

                                        <CardHeader className="pb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <Icon className="h-5 w-5 text-emerald-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-zinc-100 text-sm leading-tight truncate">
                                                        {listing.projectName}
                                                    </h3>
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                                                        <MapPin className="h-3 w-3" />
                                                        {country}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-3 pb-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-lg bg-[#060a08] px-3 py-2">
                                                    <div className="text-xs text-zinc-600">
                                                        Price/ton
                                                    </div>
                                                    <div className="text-sm font-semibold text-emerald-400">
                                                        {listing.pricePerTon} MATIC
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-[#060a08] px-3 py-2">
                                                    <div className="text-xs text-zinc-600">
                                                        Available
                                                    </div>
                                                    <div className="text-sm font-semibold text-zinc-200">
                                                        {parseFloat(listing.availableSupply).toLocaleString()} t
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-zinc-500">
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
                                                <div className="text-xs text-zinc-600 truncate">
                                                    {methodology}
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="flex gap-2 border-t border-emerald-900/20 pt-4">
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
                                                className="w-24 bg-[#060a08] border-emerald-900/30 text-sm"
                                            />
                                            <Button
                                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium text-sm"
                                                disabled={
                                                    !isConnected ||
                                                    isTxPending ||
                                                    !contractsReady
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
