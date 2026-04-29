const hre = require("hardhat");

async function main() {
  const Factory = await hre.ethers.getContractFactory("MaintenanceRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("MaintenanceRegistry deployed to:", address);
  console.log("Set VITE_CONTRACT_ADDRESS=", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
