import { http, createConfig } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
    appName: "EcoChain",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
    chains: [polygonAmoy],
    transports: {
        [polygonAmoy.id]: http(
            process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology"
        ),
    },
    ssr: true,
});

// ─── Contract Addresses ───
export const ECOCREDITS_ADDRESS =
    (process.env.NEXT_PUBLIC_ECOCREDITS_CONTRACT as `0x${string}`) || "0x0000000000000000000000000000000000000000";

export const MARKETPLACE_ADDRESS =
    (process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT as `0x${string}`) || "0x0000000000000000000000000000000000000000";
