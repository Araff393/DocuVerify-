export const certificateRegistryAbi = [
  "event CertificateRegistered(string indexed certificateId, string certificateName, string ownerName, string issuedDate, string cid, uint256 createdAt)",
  "function registerCertificate(string certificateId, string certificateName, string ownerName, string issuedDate, string cid)",
  "function getCertificateById(string certificateId) view returns (tuple(string certificateId, string certificateName, string ownerName, string issuedDate, string cid, uint256 createdAt))",
  "function getCertificateCID(string certificateId) view returns (string)",
  "function getAllCertificateIds() view returns (string[])"
] as const;
