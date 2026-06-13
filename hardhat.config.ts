import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const accounts = process.env.SERVER_WALLET_PRIVATE_KEY
  ? [process.env.SERVER_WALLET_PRIVATE_KEY]
  : [];

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts
    }
  }
};

export default config;
