// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {
    struct Certificate {
        string certificateId;
        string certificateName;
        string ownerName;
        string issuedDate;
        string cid;
        uint256 createdAt;
    }

    mapping(string => Certificate) private certificates;
    mapping(string => bool) private certificateExists;
    string[] private certificateIds;

    event CertificateRegistered(
        string indexed certificateId,
        string certificateName,
        string ownerName,
        string issuedDate,
        string cid,
        uint256 createdAt
    );

    function registerCertificate(
        string calldata certificateId,
        string calldata certificateName,
        string calldata ownerName,
        string calldata issuedDate,
        string calldata cid
    ) external {
        require(bytes(certificateId).length > 0, "Certificate ID is required");
        require(!certificateExists[certificateId], "Certificate ID already exists");

        Certificate memory certificate = Certificate({
            certificateId: certificateId,
            certificateName: certificateName,
            ownerName: ownerName,
            issuedDate: issuedDate,
            cid: cid,
            createdAt: block.timestamp
        });

        certificates[certificateId] = certificate;
        certificateExists[certificateId] = true;
        certificateIds.push(certificateId);

        emit CertificateRegistered(
            certificateId,
            certificateName,
            ownerName,
            issuedDate,
            cid,
            certificate.createdAt
        );
    }

    function getCertificateById(string calldata certificateId) external view returns (Certificate memory) {
        require(certificateExists[certificateId], "Certificate not found");
        return certificates[certificateId];
    }

    function getCertificateCID(string calldata certificateId) external view returns (string memory) {
        require(certificateExists[certificateId], "Certificate not found");
        return certificates[certificateId].cid;
    }

    function getAllCertificateIds() external view returns (string[] memory) {
        return certificateIds;
    }
}
