"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
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
import { MARKETPLACE_ADDRESS } from "@/lib/wagmi";

// Mock marketplace data
const mockListings = [
    {
        id: 0,
        tokenId: 1,
        projectName: "Amazon Rainforest Conservation",
        seller: "0x742d35Cc6634C0532925a3b844Bc9e7595f1B1dC",
        amount: 500,
        pricePerUnit: "0.025",
        type: "Conservation",
        typeIcon: TreePine,
        location: "Brazil",
        vintage: "2025",
        methodology: "VCS VM0015",
        confidence: 94,
    },
    {
        id: 1,
        tokenId: 2,
        projectName: "Saharan Solar Farm Grid",
        seller: "0x8ba1f109551bD432803012645Hc136E7D68eFb1d",
        amount: 1200,
        pricePerUnit: "0.018",
        type: "Renewable Energy",
        typeIcon: Wind,
        location: "Morocco",
        vintage: "2025",
        methodology: "Gold Standard",
        confidence: 97,
    },
    {
        id: 2,
        tokenId: 3,
        projectName: "Nordic Direct Air Capture",
        seller: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        amount: 200,
        pricePerUnit: "0.085",
        type: "Industrial",
        typeIcon: Factory,
        location: "Iceland",
        vintage: "2026",
        methodology: "Puro Standard",
        confidence: 99,
    },
    {
        id: 3,
        tokenId: 4,
        projectName: "Borneo Mangrove Restoration",
        seller: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
        amount: 800,
        pricePerUnit: "0.032",
        type: "Reforestation",
        typeIcon: TreePine,
        location: "Indonesia",
        vintage: "2025",
        methodology: "VCS VM0033",
        confidence: 91,
    },
    {
        id: 4,
        tokenId: 5,
        projectName: "Patagonia Wind Energy",
        seller: "0xdD2FD4581271e230360230F9337D5c90b1CDD67b",
        amount: 950,
        pricePerUnit: "0.021",
        type: "Renewable Energy",
        typeIcon: Wind,
        location: "Argentina",
        vintage: "2025",
        methodology: "Gold Standard",
        confidence: 96,
    },
    {
        id: 5,
        tokenId: 6,
        projectName: "Congo Basin Forest Protection",
        seller: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C11191",
        amount: 1500,
        pricePerUnit: "0.015",
        type: "Conservation",
        typeIcon: Leaf,
        location: "DRC Congo",
        vintage: "2024",
        methodology: "VCS VM0009",
        confidence: 88,
    },
];

export default function MarketplacePage() {
    const { isConnected } = useAccount();
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState("price-low");
    const [buyAmounts, setBuyAmounts] = useState<Record<number, string>>({});

    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isTxPending } = useWaitForTransactionReceipt({ hash: txHash });

    const filtered = mockListings
        .filter((l) => {
            const matchesSearch =
                l.projectName.toLowerCase().includes(search.toLowerCase()) ||
                l.location.toLowerCase().includes(search.toLowerCase());
            const matchesType = filterType === "all" || l.type.toLowerCase().includes(filterType.toLowerCase());
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (sortBy === "price-low") return parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit);
            if (sortBy === "price-high") return parseFloat(b.pricePerUnit) - parseFloat(a.pricePerUnit);
            if (sortBy === "supply") return b.amount - a.amount;
            return 0;
        });

    const handleBuy = (listing: (typeof mockListings)[0]) => {
        const amount = parseInt(buyAmounts[listing.id] || "1");
        if (!amount || amount <= 0 || amount > listing.amount) {
            toast.error("Invalid amount");
            return;
        }

        const totalPrice = parseEther(
            (parseFloat(listing.pricePerUnit) * amount).toFixed(18)
        );

        writeContract(
            {
                address: MARKETPLACE_ADDRESS,
                abi: MARKETPLACE_ABI,
                functionName: "buy",
                args: [BigInt(listing.id), BigInt(amount)],
                value: totalPrice,
            },
            {
                onSuccess: () => {
                    toast.success(`Purchased ${amount} credits from ${listing.projectName}!`);
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
                                <h1 className="text-2xl font-bold text-zinc-100">Marketplace</h1>
                            </div>
                            <p className="text-zinc-500 text-sm">Browse and purchase verified carbon credits from projects worldwide.</p>
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
                <div className="mb-4 text-sm text-zinc-500">
                    {filtered.length} project{filtered.length !== 1 ? "s" : ""} found
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((listing) => (
                        <Card
                            key={listing.id}
                            className="group relative overflow-hidden border-emerald-900/20 bg-[#0a1210]/80 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5"
                        >
                            {/* Type Badge */}
                            <div className="absolute top-4 right-4 z-10">
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                                >
                                    {listing.type}
                                </Badge>
                            </div>

                            {/* Gradient Banner */}
                            <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />

                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <listing.typeIcon className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-zinc-100 text-sm leading-tight truncate">
                                            {listing.projectName}
                                        </h3>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                                            <MapPin className="h-3 w-3" />
                                            {listing.location}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 pb-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-[#060a08] px-3 py-2">
                                        <div className="text-xs text-zinc-600">Price/ton</div>
                                        <div className="text-sm font-semibold text-emerald-400">
                                            {listing.pricePerUnit} MATIC
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-[#060a08] px-3 py-2">
                                        <div className="text-xs text-zinc-600">Available</div>
                                        <div className="text-sm font-semibold text-zinc-200">
                                            {listing.amount.toLocaleString()} t
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-zinc-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Vintage {listing.vintage}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {listing.confidence}% verified
                                    </div>
                                </div>

                                <div className="text-xs text-zinc-600 truncate">
                                    {listing.methodology}
                                </div>
                            </CardContent>

                            <CardFooter className="flex gap-2 border-t border-emerald-900/20 pt-4">
                                <Input
                                    type="number"
                                    min="1"
                                    max={listing.amount}
                                    placeholder="Qty"
                                    value={buyAmounts[listing.id] || ""}
                                    onChange={(e) =>
                                        setBuyAmounts({ ...buyAmounts, [listing.id]: e.target.value })
                                    }
                                    className="w-24 bg-[#060a08] border-emerald-900/30 text-sm"
                                />
                                <Button
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium text-sm"
                                    disabled={!isConnected || isTxPending}
                                    onClick={() => handleBuy(listing)}
                                >
                                    {!isConnected ? "Connect Wallet" : isTxPending ? "Pending..." : "Buy Credits"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
