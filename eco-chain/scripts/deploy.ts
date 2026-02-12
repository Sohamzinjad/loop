import hre from "hardhat";

async function main() {
    console.log("🌿 Deploying EcoChain Contracts to Polygon Amoy...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance), "MATIC\n");

    // ─── Deploy EcoCredits ───
    const EcoCredits = await hre.ethers.getContractFactory("EcoCredits");
    const baseURI = "https://ecochain.app/api/metadata/{id}.json";
    const ecoCredits = await EcoCredits.deploy(baseURI);
    await ecoCredits.waitForDeployment();
    const creditsAddress = await ecoCredits.getAddress();
    console.log("✅ EcoCredits deployed to:", creditsAddress);

    // ─── Deploy Marketplace ───
    const EcoMarketplace = await hre.ethers.getContractFactory("EcoMarketplace");
    const marketplace = await EcoMarketplace.deploy(creditsAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("✅ EcoMarketplace deployed to:", marketplaceAddress);

    console.log("\n─── Contract Addresses ───");
    console.log(`NEXT_PUBLIC_ECOCREDITS_CONTRACT=${creditsAddress}`);
    console.log(`NEXT_PUBLIC_MARKETPLACE_CONTRACT=${marketplaceAddress}`);
    console.log("\n📋 Add these to your .env.local file");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
