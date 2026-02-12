"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
    Flame,
    Download,
    CheckCircle2,
    Wallet,
    FileText,
    TreePine,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ECOCREDITS_ABI } from "@/lib/contracts";
import { ECOCREDITS_ADDRESS } from "@/lib/wagmi";
import { generateCertificate } from "@/actions/certificate";

// Mock owned credits
const ownedCredits = [
    { tokenId: 1, projectName: "Amazon Rainforest Conservation", balance: 1200 },
    { tokenId: 2, projectName: "Saharan Solar Farm Grid", balance: 500 },
    { tokenId: 4, projectName: "Borneo Mangrove Restoration", balance: 450 },
    { tokenId: 5, projectName: "Patagonia Wind Energy", balance: 300 },
];

// Mock retirement history
const retirementHistory = [
    {
        txHash: "0xabc123...def456",
        projectName: "Amazon Rainforest Conservation",
        amount: 200,
        reason: "Q4 2025 Emissions Offset",
        date: "2025-12-20",
        certificateUrl: "#",
    },
    {
        txHash: "0x789abc...123def",
        projectName: "Saharan Solar Farm Grid",
        amount: 380,
        reason: "Annual Carbon Neutrality Goal",
        date: "2026-01-15",
        certificateUrl: "#",
    },
];

export default function RetirePage() {
    const { address, isConnected } = useAccount();
    const [selectedToken, setSelectedToken] = useState("");
    const [amount, setAmount] = useState("");
    const [retireeName, setRetireeName] = useState("");
    const [reason, setReason] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [certificate, setCertificate] = useState<string | null>(null);

    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    const selectedCredit = ownedCredits.find((c) => c.tokenId.toString() === selectedToken);

    const handleRetire = async () => {
        if (!selectedToken || !amount || !retireeName || !reason) {
            toast.error("Please fill in all fields");
            return;
        }

        const qty = parseInt(amount);
        if (!qty || qty <= 0 || (selectedCredit && qty > selectedCredit.balance)) {
            toast.error("Invalid amount");
            return;
        }

        writeContract(
            {
                address: ECOCREDITS_ADDRESS,
                abi: ECOCREDITS_ABI,
                functionName: "retire",
                args: [BigInt(selectedToken), BigInt(qty), retireeName, reason],
            },
            {
                onSuccess: async (hash) => {
                    toast.success("Credits retired on-chain! Generating certificate...");

                    setIsGenerating(true);
                    const result = await generateCertificate({
                        txHash: hash,
                        retireeName,
                        reason,
                        tokenId: parseInt(selectedToken),
                        amount: qty,
                        projectName: selectedCredit?.projectName || "Unknown Project",
                    });

                    if (result.success && result.certificateUrl) {
                        setCertificate(result.certificateUrl);
                        toast.success("Certificate generated!");
                    }
                    setIsGenerating(false);
                },
                onError: (error) => {
                    toast.error(error.message.slice(0, 100));
                },
            }
        );
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid">
                <Card className="max-w-md w-full border-emerald-900/20 bg-[#0a1210]/80">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20">
                            <Wallet className="h-8 w-8 text-orange-400" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-100">Connect Your Wallet</h2>
                        <p className="text-sm text-zinc-500">Connect to retire carbon credits and generate certificates.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-grid">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                        <Flame className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-100">Retire Credits</h1>
                        <p className="text-sm text-zinc-500">Permanently retire credits to offset your carbon footprint.</p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    {/* ─── Retire Form ─── */}
                    <div className="lg:col-span-2">
                        <Card className="border-emerald-900/20 bg-[#0a1210]/80 glow-green">
                            <CardHeader>
                                <CardTitle className="text-lg text-zinc-100">Retire Carbon Credits</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Select Credit</Label>
                                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                                        <SelectTrigger className="bg-[#060a08] border-emerald-900/30">
                                            <SelectValue placeholder="Choose a credit to retire" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a1210] border-emerald-900/30">
                                            {ownedCredits.map((c) => (
                                                <SelectItem key={c.tokenId} value={c.tokenId.toString()}>
                                                    {c.projectName} ({c.balance} t)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Amount (tons CO₂)</Label>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="e.g. 100"
                                        max={selectedCredit?.balance}
                                        className="bg-[#060a08] border-emerald-900/30"
                                    />
                                    {selectedCredit && (
                                        <p className="text-xs text-zinc-600">
                                            Available: {selectedCredit.balance.toLocaleString()} tons
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Retiree Name / Organization</Label>
                                    <Input
                                        value={retireeName}
                                        onChange={(e) => setRetireeName(e.target.value)}
                                        placeholder="e.g. Acme Corporation"
                                        className="bg-[#060a08] border-emerald-900/30"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Retirement Reason</Label>
                                    <Textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g. Annual carbon neutrality commitment"
                                        className="bg-[#060a08] border-emerald-900/30 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <Separator className="bg-emerald-900/20" />

                                <Button
                                    onClick={handleRetire}
                                    disabled={isTxPending || isGenerating}
                                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold"
                                >
                                    {isTxPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Confirming on chain...
                                        </>
                                    ) : isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating certificate...
                                        </>
                                    ) : (
                                        <>
                                            <Flame className="h-4 w-4 mr-2" />
                                            Retire & Burn Credits
                                        </>
                                    )}
                                </Button>

                                {/* Certificate Download */}
                                {certificate && (
                                    <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-emerald-400">Certificate Ready!</p>
                                            <p className="text-xs text-zinc-500 truncate">TX: {txHash}</p>
                                        </div>
                                        <a href={certificate} download={`ecochain-certificate-${txHash?.slice(0, 8)}.pdf`}>
                                            <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ─── Retirement History ─── */}
                    <div className="lg:col-span-3">
                        <Card className="border-emerald-900/20 bg-[#0a1210]/80">
                            <CardHeader>
                                <CardTitle className="text-lg text-zinc-100 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-zinc-400" />
                                    Retirement History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {retirementHistory.map((entry) => (
                                    <div
                                        key={entry.txHash}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-emerald-900/20 bg-[#060a08]/60 p-4 hover:border-emerald-500/20 transition-colors"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                                                <TreePine className="h-5 w-5 text-orange-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-zinc-200 text-sm">{entry.projectName}</h4>
                                                <p className="text-xs text-zinc-500 mt-0.5">{entry.reason}</p>
                                                <p className="text-xs text-zinc-600 mt-0.5 font-mono">{entry.txHash}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-orange-400">{entry.amount} t CO₂</p>
                                                <p className="text-xs text-zinc-600">{entry.date}</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0">
                                                <Download className="h-3 w-3 mr-1" />
                                                PDF
                                            </Badge>
                                        </div>
                                    </div>
                                ))}

                                {retirementHistory.length === 0 && (
                                    <div className="text-center py-12 text-zinc-600">
                                        <Flame className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                                        <p>No retirements yet. Retire credits to generate certificates.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
