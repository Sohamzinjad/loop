"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    Leaf,
    BarChart3,
    ShoppingBag,
    MapPin,
    Flame,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import ThemeToggle from "@/components/theme-toggle";

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
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-background/60 backdrop-blur-[16px] saturate-150 transition-all duration-300">
            <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="group flex items-center gap-2.5">
                    <div className="animate-pulse-ring flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-surge-orange to-surge-orange-dark shadow-lg shadow-surge-orange/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-surge-orange/40">
                        <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="gradient-text text-xl font-bold tracking-tight">
                        EcoChain
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 p-1.5 backdrop-blur-xl shadow-sm">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant="ghost"
                                    className={`gap-2 rounded-full px-4 py-2 h-auto text-sm font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${isActive
                                        ? "bg-primary/15 text-primary hover:bg-primary/20 shadow-sm"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                        }`}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Button>
                            </Link>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    <div className="hidden sm:block">
                        <div className="px-1 py-0.5">
                            <ConnectButton
                                chainStatus="icon"
                                accountStatus="avatar"
                                showBalance={false}
                            />
                        </div>
                    </div>

                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="eco-surface rounded-full text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                            >
                                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 border-r-0 border-l border-border/70 bg-background/80 backdrop-blur-[24px] saturate-150">
                            <div className="flex flex-col gap-5 pt-8">
                                <div className="mb-2 flex items-center justify-between sm:hidden px-2">
                                    <ThemeToggle />
                                    <div className="eco-surface rounded-full border-border/80 px-1 py-0.5 shadow-sm">
                                        <ConnectButton chainStatus="icon" accountStatus="avatar" showBalance={false} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {navLinks.map((link) => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setOpen(false)}
                                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] ${isActive
                                                    ? "bg-primary/15 text-primary shadow-sm"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                                    }`}
                                            >
                                                <link.icon className="h-5 w-5" />
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
