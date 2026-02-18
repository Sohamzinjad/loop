async function main() {
  const runtime = typeof hre !== "undefined" ? hre : require("hardhat");
  const { ethers, network } = runtime;
  const networkName = network.name;
  const isLocalNetwork =
    networkName === "hardhat" || networkName === "localhost";

  if (!isLocalNetwork) {
    const rawPrivateKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim();
    const normalizedPrivateKey = rawPrivateKey.startsWith("0x")
      ? rawPrivateKey
      : `0x${rawPrivateKey}`;
    const hasValidPrivateKey = /^0x[0-9a-fA-F]{64}$/.test(
      normalizedPrivateKey
    );

    if (!hasValidPrivateKey) {
      throw new Error(
        "Invalid DEPLOYER_PRIVATE_KEY in .env.local. Set a real EVM private key as 0x + 64 hex characters."
      );
    }
  }

  console.log(`Deploying EcoChain contracts to ${networkName}...`);

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "No deployer account available. Set DEPLOYER_PRIVATE_KEY in .env.local for remote deployment."
    );
  }

  const [deployer] = signers;
  console.log("Deployer address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MATIC");

  const EcoCredits = await ethers.getContractFactory("EcoCredits");
  const ecoCredits = await EcoCredits.deploy(
    "https://ecochain.app/api/metadata/{id}.json"
  );
  await ecoCredits.waitForDeployment();
  const creditsAddress = await ecoCredits.getAddress();
  console.log("EcoCredits deployed:", creditsAddress);

  const EcoMarketplace = await ethers.getContractFactory("EcoMarketplace");
  const marketplace = await EcoMarketplace.deploy(creditsAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("EcoMarketplace deployed:", marketplaceAddress);

  console.log("NEXT_PUBLIC_ECOCREDITS_CONTRACT=", creditsAddress);
  console.log("NEXT_PUBLIC_MARKETPLACE_CONTRACT=", marketplaceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
