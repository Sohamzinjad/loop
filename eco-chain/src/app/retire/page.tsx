"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
    Flame,
    Wallet,
    Send,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ECOCREDITS_ABI } from "@/lib/contracts";
import { ECOCREDITS_ADDRESS, areContractsConfigured } from "@/lib/wagmi";
import { generateCertificate } from "@/actions/certificate";

interface OwnedCredit {
    tokenId: number;
    projectName: string;
    balance: number;
    projectType: string;
}

export default function RetirePage() {
    const { address, isConnected } = useAccount();
    const contractsReady = areContractsConfigured();

    const [selectedCredit, setSelectedCredit] = useState<OwnedCredit | null>(null);
    const [retireAmount, setRetireAmount] = useState("1");
    const [retireeName, setRetireeName] = useState("");
    const [retireReason, setRetireReason] = useState("");
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const [ownedCredits] = useState<OwnedCredit[]>([]);

    const { writeContract, data: txHash } = useWriteContract();
    const {
        isLoading: isTxPending,
        isSuccess: isTxSuccess,
        data: txReceipt,
    } = useWaitForTransactionReceipt({ hash: txHash });

    const handleRetire = () => {
        if (!selectedCredit || !retireeName.trim()) {
            toast.error("Select a credit and enter your name");
            return;
        }

        if (!contractsReady) {
            toast.error("Contracts not deployed yet");
            return;
        }

        const amount = parseInt(retireAmount);
        if (!amount || amount <= 0 || amount > selectedCredit.balance) {
            toast.error("Invalid amount");
            return;
        }

        writeContract(
            {
                address: ECOCREDITS_ADDRESS,
                abi: ECOCREDITS_ABI,
                functionName: "retire",
                args: [
                    BigInt(selectedCredit.tokenId),
                    BigInt(amount),
                    retireeName.trim(),
                    retireReason.trim(),
                ],
            },
            {
                onSuccess: async (hash) => {
                    toast.success("Credits retired on-chain! Generating certificate...");

                    // Generate certificate
                    setIsGeneratingCert(true);
                    try {
                        const cert = await generateCertificate({
                            txHash: hash,
                            tokenId: selectedCredit.tokenId,
                            amount,
                            projectName: selectedCredit.projectName,
                            retireeName: retireeName.trim(),
                            reason: retireReason.trim(),
                            walletAddress: address || "",
                        });

                        if (cert.success && cert.certificateUrl) {
                            toast.success("Certificate generated!");
                            // Open certificate in a new tab
                            const link = document.createElement("a");
                            link.href = cert.certificateUrl;
                            link.download = `certificate-${hash.slice(0, 8)}.pdf`;
                            link.click();
                        }
                    } catch {
                        toast.error("Certificate generation failed");
                    } finally {
                        setIsGeneratingCert(false);
                    }
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
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Wallet className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-100">
                            Connect Your Wallet
                        </h2>
                        <p className="text-sm text-zinc-500">
                            Connect your wallet to retire carbon credits and
                            receive certificates of impact.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-grid">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                            <Flame className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-100">
                            Retire Credits
                        </h1>
                    </div>
                    <p className="text-zinc-500 text-sm">
                        Permanently retire carbon credits to offset emissions and receive
                        a verifiable certificate.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    {/* ─── Left: Select Credits ─── */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400">
                            Select Credits to Retire
                        </h3>

                        {ownedCredits.length === 0 ? (
                            <Card className="border-emerald-900/20 bg-[#0a1210]/80">
                                <CardContent className="flex flex-col items-center py-8 text-center">
                                    <AlertCircle className="h-10 w-10 text-zinc-700 mb-3" />
                                    <p className="text-sm text-zinc-500">
                                        You don&apos;t own any carbon credits yet.
                                    </p>
                                    <p className="text-xs text-zinc-600 mt-1">
                                        Purchase credits from the marketplace first.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            ownedCredits.map((credit) => (
                                <Card
                                    key={credit.tokenId}
                                    className={`cursor-pointer border transition-all duration-200 ${selectedCredit?.tokenId === credit.tokenId
                                            ? "border-emerald-500/50 bg-emerald-500/5"
                                            : "border-emerald-900/20 bg-[#0a1210]/80 hover:border-emerald-500/30"
                                        }`}
                                    onClick={() => setSelectedCredit(credit)}
                                >
                                    <CardContent className="flex items-center justify-between pt-6">
                                        <div>
                                            <p className="font-medium text-zinc-100 text-sm">
                                                {credit.projectName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                >
                                                    {credit.projectType}
                                                </Badge>
                                                <span className="text-xs text-zinc-500">
                                                    Token #{credit.tokenId}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-zinc-100">
                                                {credit.balance}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                available
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* ─── Right: Retirement Form ─── */}
                    <div className="lg:col-span-3">
                        <Card className="border-emerald-900/20 bg-[#0a1210]/80">
                            <CardHeader>
                                <CardTitle className="text-zinc-100 text-lg">
                                    Retirement Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">
                                            Amount to Retire *
                                        </Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max={selectedCredit?.balance || 0}
                                            value={retireAmount}
                                            onChange={(e) =>
                                                setRetireAmount(e.target.value)
                                            }
                                            className="bg-[#060a08] border-emerald-900/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400">
                                            Selected Credit
                                        </Label>
                                        <div className="flex h-10 items-center px-3 rounded-md bg-[#060a08] border border-emerald-900/30 text-sm text-zinc-400">
                                            {selectedCredit
                                                ? `#${selectedCredit.tokenId} — ${selectedCredit.projectName}`
                                                : "None selected"}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">
                                        Retiree Name *
                                    </Label>
                                    <Input
                                        value={retireeName}
                                        onChange={(e) =>
                                            setRetireeName(e.target.value)
                                        }
                                        placeholder="Your name or organization"
                                        className="bg-[#060a08] border-emerald-900/30"
                                        maxLength={200}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">
                                        Reason for Retirement
                                    </Label>
                                    <Textarea
                                        value={retireReason}
                                        onChange={(e) =>
                                            setRetireReason(e.target.value)
                                        }
                                        placeholder="e.g. Offsetting 2026 corporate emissions"
                                        className="bg-[#060a08] border-emerald-900/30 resize-none"
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>

                                <Separator className="bg-emerald-900/20" />

                                {/* Summary */}
                                {selectedCredit && (
                                    <div className="rounded-lg bg-[#060a08] border border-emerald-900/20 p-4 space-y-2">
                                        <h4 className="text-sm font-medium text-zinc-300">
                                            Retirement Summary
                                        </h4>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">
                                                Project
                                            </span>
                                            <span className="text-zinc-200">
                                                {selectedCredit.projectName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">
                                                Amount
                                            </span>
                                            <span className="text-emerald-400 font-semibold">
                                                {retireAmount} tons CO₂
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500">
                                                Retiree
                                            </span>
                                            <span className="text-zinc-200">
                                                {retireeName || "—"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleRetire}
                                    disabled={
                                        !selectedCredit ||
                                        !retireeName.trim() ||
                                        isTxPending ||
                                        isGeneratingCert ||
                                        !contractsReady
                                    }
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold"
                                >
                                    {!contractsReady ? (
                                        "Contracts Not Deployed"
                                    ) : isTxPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Confirming on-chain...
                                        </>
                                    ) : isGeneratingCert ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating certificate...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Retire Credits
                                        </>
                                    )}
                                </Button>

                                {/* Success State */}
                                {isTxSuccess && txReceipt && (
                                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="font-medium">
                                                Credits Retired Successfully
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 font-mono break-all">
                                            Tx: {txReceipt.transactionHash}
                                        </p>
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
