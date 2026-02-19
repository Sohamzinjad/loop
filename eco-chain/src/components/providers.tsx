"use client";

import * as React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    RainbowKitProvider,
    darkTheme,
    lightTheme,
} from "@rainbow-me/rainbowkit";
import { ThemeProvider, useTheme } from "next-themes";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "@/lib/wagmi";

const queryClient = new QueryClient();

function WalletThemeProvider({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = resolvedTheme !== "light";

    // Prevent hydration mismatch by only rendering theme-dependent provider on client
    if (!mounted) {
        return <div style={{ visibility: "hidden" }}>{children}</div>;
    }

    return (
        <RainbowKitProvider
            theme={
                isDark
                    ? darkTheme({
                        accentColor: "#e07850",
                        accentColorForeground: "#1a1a1a",
                        borderRadius: "large",
                        fontStack: "system",
                        overlayBlur: "small",
                    })
                    : lightTheme({
                        accentColor: "#d56840",
                        accentColorForeground: "#ffffff",
                        borderRadius: "large",
                        fontStack: "system",
                        overlayBlur: "small",
                    })
            }
            modalSize="compact"
        >
            {children}
        </RainbowKitProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <WalletThemeProvider>{children}</WalletThemeProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </ThemeProvider>
    );
}
