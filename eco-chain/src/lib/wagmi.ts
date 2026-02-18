import { http } from "wagmi";
import { mainnet, polygon, polygonAmoy } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// ─── Validate Required Environment Variables ───
const rawWalletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?.trim();

const walletConnectProjectId =
    rawWalletConnectProjectId &&
    rawWalletConnectProjectId !== "YOUR_WALLETCONNECT_PROJECT_ID"
        ? rawWalletConnectProjectId
        : undefined;

if (!walletConnectProjectId && typeof window !== "undefined") {
    console.warn(
        "[EcoChain] NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is missing or using a placeholder. " +
            "Injected wallets (e.g. MetaMask browser extension) can still connect, but " +
            "WalletConnect QR/mobile flows require a real project ID."
    );
}

export const config = getDefaultConfig({
    appName: "EcoChain",
    projectId: walletConnectProjectId || "demo",
    chains: [mainnet, polygon, polygonAmoy],
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [polygonAmoy.id]: http(
            process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC ||
            "https://rpc-amoy.polygon.technology"
        ),
    },
    ssr: true,
});

// ─── Contract Addresses ───
const ecoCreditsRaw = process.env.NEXT_PUBLIC_ECOCREDITS_CONTRACT || "";
const marketplaceRaw = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT || "";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const ECOCREDITS_ADDRESS: `0x${string}` =
    (ecoCreditsRaw as `0x${string}`) || ZERO_ADDRESS;

export const MARKETPLACE_ADDRESS: `0x${string}` =
    (marketplaceRaw as `0x${string}`) || ZERO_ADDRESS;

/** Returns true if contracts are deployed and configured */
export function areContractsConfigured(): boolean {
    return (
        ECOCREDITS_ADDRESS !== ZERO_ADDRESS &&
        MARKETPLACE_ADDRESS !== ZERO_ADDRESS
    );
}
