import "server-only";

import { Contract, EventLog, JsonRpcProvider, Wallet } from "ethers";

import { certificateRegistryAbi } from "@/lib/contract";
import { getPublicConfig, getServerEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { CertificateRecord, RegisterCertificateInput } from "@/lib/types";

type ContractCertificate = {
  certificateId: string;
  certificateName: string;
  ownerName: string;
  issuedDate: string;
  cid: string;
  createdAt: bigint;
};

function getReadonlyContract() {
  const { sepoliaRpcUrl, contractAddress } = getServerEnv();
  const provider = new JsonRpcProvider(sepoliaRpcUrl);
  return new Contract(contractAddress, certificateRegistryAbi, provider);
}

function getWritableContract() {
  const { sepoliaRpcUrl, contractAddress, serverWalletPrivateKey } = getServerEnv();
  const provider = new JsonRpcProvider(sepoliaRpcUrl);
  const wallet = new Wallet(serverWalletPrivateKey, provider);
  return new Contract(contractAddress, certificateRegistryAbi, wallet);
}

function mapCertificate(record: ContractCertificate): CertificateRecord {
  return {
    certificateId: record.certificateId,
    certificateName: record.certificateName,
    ownerName: record.ownerName,
    issuedDate: record.issuedDate,
    cid: record.cid,
    createdAt: Number(record.createdAt)
  };
}

function withExplorerUrl(transactionHash?: string) {
  if (!transactionHash) {
    return undefined;
  }

  const { explorerBaseUrl } = getPublicConfig();
  return `${explorerBaseUrl}/tx/${transactionHash}`;
}

function parseChainError(error: unknown): never {
  const message =
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan saat berkomunikasi dengan blockchain.";

  if (message.includes("Certificate not found")) {
    throw new AppError("not_found", "Certificate ID tidak ditemukan di blockchain.", 404);
  }

  if (message.includes("Certificate ID already exists")) {
    throw new AppError("blockchain", "Certificate ID sudah terdaftar.", 409);
  }

  if (message.includes("Certificate ID is required")) {
    throw new AppError("validation", "Certificate ID wajib diisi.", 400);
  }

  throw new AppError("blockchain", "Operasi blockchain gagal dijalankan.", 500, message);
}

export async function registerCertificateOnChain(input: RegisterCertificateInput, cid: string) {
  try {
    const contract = getWritableContract();
    const tx = await contract.registerCertificate(
      input.certificateId,
      input.certificateName,
      input.ownerName,
      input.issuedDate,
      cid
    );
    const receipt = await tx.wait();
    const certificate = await getCertificateById(input.certificateId);

    return {
      certificate: {
        ...certificate,
        transactionHash: receipt?.hash,
        explorerUrl: withExplorerUrl(receipt?.hash)
      },
      transactionHash: receipt?.hash as string,
      explorerUrl: withExplorerUrl(receipt?.hash)
    };
  } catch (error) {
    parseChainError(error);
  }
}

export async function getCertificateById(certificateId: string): Promise<CertificateRecord> {
  try {
    const contract = getReadonlyContract();
    const record = (await contract.getCertificateById(certificateId)) as ContractCertificate;
    return mapCertificate(record);
  } catch (error) {
    parseChainError(error);
  }
}

export async function getCertificateCid(certificateId: string): Promise<string> {
  try {
    const contract = getReadonlyContract();
    return (await contract.getCertificateCID(certificateId)) as string;
  } catch (error) {
    parseChainError(error);
  }
}

export async function listCertificates(): Promise<CertificateRecord[]> {
  try {
    const contract = getReadonlyContract();
    const ids = (await contract.getAllCertificateIds()) as string[];

    if (!ids.length) {
      return [];
    }

    const [records, events] = await Promise.all([
      Promise.all(ids.map((id) => contract.getCertificateById(id) as Promise<ContractCertificate>)),
      contract.queryFilter(contract.filters.CertificateRegistered(), 0, "latest")
    ]);

    const transactionById = new Map<string, string>();

    for (const event of events) {
      if (!(event instanceof EventLog)) {
        continue;
      }

      const certificateId = String(event.args?.[0] ?? "");
      if (certificateId) {
        transactionById.set(certificateId, event.transactionHash);
      }
    }

    return records
      .map((record) => {
        const certificate = mapCertificate(record);
        const transactionHash = transactionById.get(certificate.certificateId);
        return {
          ...certificate,
          transactionHash,
          explorerUrl: withExplorerUrl(transactionHash)
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    parseChainError(error);
  }
}
