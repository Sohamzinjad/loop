import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const deployerPrivateKeyRaw = process.env.DEPLOYER_PRIVATE_KEY?.trim();
const deployerPrivateKey = deployerPrivateKeyRaw
    ? deployerPrivateKeyRaw.startsWith("0x")
        ? deployerPrivateKeyRaw
        : `0x${deployerPrivateKeyRaw}`
    : undefined;
const hasValidPrivateKey =
    typeof deployerPrivateKey === "string" &&
    /^0x[0-9a-fA-F]{64}$/.test(deployerPrivateKey);

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {},
        amoy: {
            url: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
            ...(hasValidPrivateKey ? { accounts: [deployerPrivateKey] } : {}),
            chainId: 80002,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
