import hre from "hardhat";

const { ethers } = hre;

async function main() {
  const factory = await ethers.getContractFactory("CertificateRegistry");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("CertificateRegistry deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
