// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyIssuer() {
        require(approvedIssuers[msg.sender] == true, "Not approved issuer");
        _;
    }

    struct Certificate {
        bytes32 certHash;
        address issuedTo;
        address issuedBy;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(bytes32 => Certificate) public certificates;
    mapping(address => bool) public approvedIssuers;

    function approveIssuer(address issuer) external onlyOwner {
        approvedIssuers[issuer] = true;
    }

    function issueCertificate(
        bytes32 certId,
        bytes32 certHash,
        address student
    ) external onlyIssuer {
        require(certificates[certId].issuedAt == 0, "Certificate exists");

        certificates[certId] = Certificate({
            certHash: certHash,
            issuedTo: student,
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });
    }

    function revokeCertificate(bytes32 certId) external {
        Certificate storage c = certificates[certId];

        require(c.issuedAt != 0, "Not found");
        require(
            msg.sender == c.issuedBy || msg.sender == owner,
            "Not allowed"
        );

        c.revoked = true;
    }

    function getCertificate(bytes32 certId)
        external
        view
        returns (Certificate memory)
    {
        return certificates[certId];
    }

    function verifySignature(bytes32 certHash, bytes memory signature)
        public
        pure
        returns (address)
    {
        return recoverSigner(certHash, signature);
    }

    function recoverSigner(bytes32 hash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        bytes32 prefixedHash =
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

        (bytes32 r, bytes32 s, uint8 v) = _split(signature);

        return ecrecover(prefixedHash, v, r, s);
    }

    function _split(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
