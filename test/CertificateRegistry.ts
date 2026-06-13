import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("CertificateRegistry", function () {
  async function deployFixture() {
    const factory = await ethers.getContractFactory("CertificateRegistry");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("registers a certificate and returns its data", async function () {
    const contract = await deployFixture();

    await contract.registerCertificate(
      "CERT-001",
      "Blockchain Fundamentals",
      "Alya Putri",
      "2026-04-12",
      "bafy-cert-001"
    );

    const certificate = await contract.getCertificateById("CERT-001");
    const cid = await contract.getCertificateCID("CERT-001");

    expect(certificate.certificateId).to.equal("CERT-001");
    expect(certificate.certificateName).to.equal("Blockchain Fundamentals");
    expect(certificate.ownerName).to.equal("Alya Putri");
    expect(certificate.issuedDate).to.equal("2026-04-12");
    expect(certificate.cid).to.equal("bafy-cert-001");
    expect(certificate.createdAt).to.be.gt(0n);
    expect(cid).to.equal("bafy-cert-001");
  });

  it("rejects an empty certificate id", async function () {
    const contract = await deployFixture();

    await expect(
      contract.registerCertificate("", "Cert", "Owner", "2026-04-12", "bafy-cid")
    ).to.be.revertedWith("Certificate ID is required");
  });

  it("rejects a duplicate certificate id", async function () {
    const contract = await deployFixture();

    await contract.registerCertificate(
      "CERT-001",
      "Blockchain Fundamentals",
      "Alya Putri",
      "2026-04-12",
      "bafy-cert-001"
    );

    await expect(
      contract.registerCertificate(
        "CERT-001",
        "Advanced Blockchain",
        "Bima Aji",
        "2026-05-01",
        "bafy-cert-002"
      )
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("lists all registered certificate ids", async function () {
    const contract = await deployFixture();

    await contract.registerCertificate("CERT-001", "Cert A", "Owner A", "2026-04-12", "cid-a");
    await contract.registerCertificate("CERT-002", "Cert B", "Owner B", "2026-04-13", "cid-b");

    const ids = await contract.getAllCertificateIds();

    expect(ids).to.deep.equal(["CERT-001", "CERT-002"]);
  });
});
