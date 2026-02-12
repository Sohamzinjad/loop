"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Leaf, BarChart3, ShoppingBag, MapPin, Flame, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navLinks = [
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/retire", label: "Retire", icon: Flame },
    { href: "/impact-map", label: "Impact Map", icon: MapPin },
];

export default function Navbar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-emerald-900/30 bg-[#0a0f0d]/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
                        <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                        EcoChain
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant="ghost"
                                    className={`gap-2 text-sm font-medium transition-all duration-200 ${isActive
                                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                            : "text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/5"
                                        }`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                {/* Wallet + Mobile Menu */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <ConnectButton
                            chainStatus="icon"
                            accountStatus="avatar"
                            showBalance={false}
                        />
                    </div>

                    {/* Mobile Menu */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon" className="text-zinc-400">
                                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 bg-[#0a0f0d] border-emerald-900/30">
                            <div className="flex flex-col gap-4 pt-8">
                                <div className="mb-4 sm:hidden">
                                    <ConnectButton chainStatus="icon" accountStatus="avatar" showBalance={false} />
                                </div>
                                {navLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setOpen(false)}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/5"
                                                }`}
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
