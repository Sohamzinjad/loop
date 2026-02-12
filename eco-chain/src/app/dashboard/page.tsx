"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
    BarChart3,
    PlusCircle,
    Wallet,
    CheckCircle2,
    Clock,
    XCircle,
    TreePine,
    TrendingUp,
    Flame,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Mock portfolio data
const portfolio = {
    totalCredits: 2450,
    totalRetired: 580,
    totalValue: 68.5,
    projectsOwned: 4,
};

const myCredits = [
    { tokenId: 1, projectName: "Amazon Rainforest Conservation", balance: 1200, value: 30.0, type: "Conservation" },
    { tokenId: 2, projectName: "Saharan Solar Farm Grid", balance: 500, value: 9.0, type: "Renewable" },
    { tokenId: 4, projectName: "Borneo Mangrove Restoration", balance: 450, value: 14.4, type: "Reforestation" },
    { tokenId: 5, projectName: "Patagonia Wind Energy", balance: 300, value: 6.3, type: "Renewable" },
];

const myProjects = [
    {
        id: 1,
        name: "Mumbai Urban Green Corridor",
        status: "verified" as const,
        credits: 500,
        type: "Urban Greening",
        submitted: "2025-12-15",
    },
    {
        id: 2,
        name: "Kerala Mangrove Restoration",
        status: "pending" as const,
        credits: 0,
        type: "Reforestation",
        submitted: "2026-01-20",
    },
    {
        id: 3,
        name: "Rajasthan Solar Initiative",
        status: "rejected" as const,
        credits: 0,
        type: "Renewable Energy",
        submitted: "2025-11-05",
    },
];

const statusConfig = {
    verified: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const [projectForm, setProjectForm] = useState({
        name: "",
        description: "",
        type: "",
        country: "",
        lat: "",
        lng: "",
        apiEndpoint: "",
    });

    const handleSubmitProject = () => {
        if (!projectForm.name || !projectForm.type) {
            toast.error("Please fill in required fields");
            return;
        }
        toast.success("Project submitted successfully! Awaiting verification.");
        setProjectForm({ name: "", description: "", type: "", country: "", lat: "", lng: "", apiEndpoint: "" });
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid">
                <Card className="max-w-md w-full border-emerald-900/20 bg-[#0a1210]/80">
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Wallet className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-100">Connect Your Wallet</h2>
                        <p className="text-sm text-zinc-500">Connect your wallet to view your dashboard, manage credits, and submit projects.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-grid">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
                        </div>
                        <p className="text-sm text-zinc-500 font-mono">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Submit Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a1210] border-emerald-900/30 max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-zinc-100">Submit New Carbon Project</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Project Name *</Label>
                                    <Input
                                        value={projectForm.name}
                                        onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                        placeholder="e.g. Amazon Reforestation Initiative"
                                        className="bg-[#060a08] border-emerald-900/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Description</Label>
                                    <Textarea
                                        value={projectForm.description}
                                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                        placeholder="Describe the project's carbon offset methodology..."
                                        className="bg-[#060a08] border-emerald-900/30 resize-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Project Type *</Label>
                                        <Select
                                            value={projectForm.type}
                                            onValueChange={(v) => setProjectForm({ ...projectForm, type: v })}
                                        >
                                            <SelectTrigger className="bg-[#060a08] border-emerald-900/30">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a1210] border-emerald-900/30">
                                                <SelectItem value="reforestation">Reforestation</SelectItem>
                                                <SelectItem value="conservation">Conservation</SelectItem>
                                                <SelectItem value="renewable">Renewable Energy</SelectItem>
                                                <SelectItem value="industrial">Industrial Capture</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Country</Label>
                                        <Input
                                            value={projectForm.country}
                                            onChange={(e) => setProjectForm({ ...projectForm, country: e.target.value })}
                                            placeholder="e.g. Brazil"
                                            className="bg-[#060a08] border-emerald-900/30"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Latitude</Label>
                                        <Input
                                            value={projectForm.lat}
                                            onChange={(e) => setProjectForm({ ...projectForm, lat: e.target.value })}
                                            placeholder="-3.4653"
                                            className="bg-[#060a08] border-emerald-900/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300">Longitude</Label>
                                        <Input
                                            value={projectForm.lng}
                                            onChange={(e) => setProjectForm({ ...projectForm, lng: e.target.value })}
                                            placeholder="-62.2159"
                                            className="bg-[#060a08] border-emerald-900/30"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">IoT/API Endpoint (optional)</Label>
                                    <Input
                                        value={projectForm.apiEndpoint}
                                        onChange={(e) => setProjectForm({ ...projectForm, apiEndpoint: e.target.value })}
                                        placeholder="https://api.example.com/emissions"
                                        className="bg-[#060a08] border-emerald-900/30"
                                    />
                                </div>
                                <Button
                                    onClick={handleSubmitProject}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                                >
                                    Submit for Verification
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* ─── Stats Grid ─── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {[
                        { label: "Total Credits", value: portfolio.totalCredits.toLocaleString(), suffix: "tons", icon: Package, color: "text-emerald-400" },
                        { label: "Total Retired", value: portfolio.totalRetired.toLocaleString(), suffix: "tons", icon: Flame, color: "text-orange-400" },
                        { label: "Portfolio Value", value: `${portfolio.totalValue} MATIC`, suffix: "", icon: TrendingUp, color: "text-cyan-400" },
                        { label: "Projects Owned", value: portfolio.projectsOwned.toString(), suffix: "credits", icon: TreePine, color: "text-lime-400" },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-emerald-900/20 bg-[#0a1210]/80">
                            <CardContent className="flex items-center gap-4 pt-6">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500">{stat.label}</p>
                                    <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ─── Tabs ─── */}
                <Tabs defaultValue="credits" className="space-y-6">
                    <TabsList className="bg-[#0a1210] border border-emerald-900/20">
                        <TabsTrigger value="credits" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            My Credits
                        </TabsTrigger>
                        <TabsTrigger value="projects" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                            My Projects
                        </TabsTrigger>
                    </TabsList>

                    {/* Credits Tab */}
                    <TabsContent value="credits" className="space-y-4">
                        {myCredits.map((credit) => (
                            <Card key={credit.tokenId} className="border-emerald-900/20 bg-[#0a1210]/80 hover:border-emerald-500/20 transition-colors">
                                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <TreePine className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-zinc-100">{credit.projectName}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                                                <span>Token #{credit.tokenId}</span>
                                                <Separator orientation="vertical" className="h-3 bg-emerald-900/30" />
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                                                    {credit.type}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-right">
                                        <div>
                                            <p className="text-xs text-zinc-500">Balance</p>
                                            <p className="text-lg font-bold text-zinc-100">{credit.balance.toLocaleString()} t</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Value</p>
                                            <p className="text-lg font-bold text-emerald-400">{credit.value} MATIC</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Projects Tab */}
                    <TabsContent value="projects" className="space-y-4">
                        {myProjects.map((project) => {
                            const status = statusConfig[project.status];
                            const StatusIcon = status.icon;
                            return (
                                <Card key={project.id} className="border-emerald-900/20 bg-[#0a1210]/80">
                                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
                                        <div>
                                            <h3 className="font-semibold text-zinc-100">{project.name}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                                                <span>{project.type}</span>
                                                <Separator orientation="vertical" className="h-3 bg-emerald-900/30" />
                                                <span>Submitted {project.submitted}</span>
                                            </div>
                                        </div>
                                        <Badge className={`${status.bg} ${status.color} border`}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
