const hre = require("hardhat");

async function main() {
    const creditsAddress = "0x595b507fa5BF3f251000fC019c697932d3D3C61A"; // Deployed EcoCredits address
    console.log("Using EcoCredits at:", creditsAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying EcoMarketplace with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance));

    const EcoMarketplace = await hre.ethers.getContractFactory("EcoMarketplace");
    const marketplace = await EcoMarketplace.deploy(creditsAddress);

    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();

    console.log("EcoMarketplace deployed to:", marketplaceAddress);
    console.log("NEXT_PUBLIC_MARKETPLACE_CONTRACT=", marketplaceAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
