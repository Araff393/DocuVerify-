function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Server-side env vars.
 *
 * Pinata dibuat opsional — sistem bisa jalan tanpa IPFS (fallback ke file lokal).
 * Panggil `isPinataConfigured()` sebelum memakai fungsi Pinata.
 */
export function getServerEnv() {
  return {
    // Pinata IPFS — opsional (bonus layer)
    pinataJwt: process.env.PINATA_JWT ?? "",
    pinataGateway:
      process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud/ipfs",

    // Blockchain — opsional (bonus layer)
    sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL ?? "",
    contractAddress: process.env.CONTRACT_ADDRESS ?? "",
    serverWalletPrivateKey: process.env.SERVER_WALLET_PRIVATE_KEY ?? "",
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111",
    explorerBaseUrl:
      process.env.NEXT_PUBLIC_EXPLORER_BASE_URL ?? "https://sepolia.etherscan.io",
  };
}

/**
 * @returns true jika PINATA_JWT di-set (panjang > 0) dan bukan placeholder.
 */
export function isPinataConfigured(): boolean {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) return false;
  if (jwt === "your_pinata_jwt") return false;
  return jwt.length > 0;
}

/**
 * Vercel does not provide durable local disk storage for uploaded PDFs.
 * Make Pinata mandatory there, while keeping local development tolerant.
 */
export function requiresPersistentPdfStorage(): boolean {
  const explicit = process.env.REQUIRE_PINATA_UPLOAD?.trim().toLowerCase();
  if (explicit === "1" || explicit === "true" || explicit === "yes") {
    return true;
  }
  if (explicit === "0" || explicit === "false" || explicit === "no") {
    return false;
  }
  return process.env.VERCEL === "1";
}

/**
 * @returns true jika konfigurasi blockchain (RPC + contract + wallet key) lengkap.
 */
export function isBlockchainConfigured(): boolean {
  const { sepoliaRpcUrl, contractAddress, serverWalletPrivateKey } =
    getServerEnv();
  if (!sepoliaRpcUrl || sepoliaRpcUrl.includes("your-key")) return false;
  if (!contractAddress || contractAddress.includes("YourContract")) return false;
  if (!serverWalletPrivateKey || serverWalletPrivateKey.includes("yourprivatekey"))
    return false;
  return true;
}

export function getPublicConfig() {
  return {
    chainId: process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111",
    explorerBaseUrl:
      process.env.NEXT_PUBLIC_EXPLORER_BASE_URL ??
      "https://sepolia.etherscan.io",
  };
}

// `getRequiredEnv` masih diexport untuk env yg memang wajib (AUTH_SECRET di auth.ts, DATABASE_URL di Prisma)
export { getRequiredEnv };
