// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {

    address public owner;

    constructor() {
        owner = msg.sender;  // Set the deployer as the owner
    }

    // Ensure only the owner can run specific functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Ensure only approved people can issue certs
    modifier onlyIssuer() {
        require(approvedIssuers[msg.sender] == true, "Not approved issuer");
        _;
    }

    // This struct holds all the details for a single certificate
    struct Certificate {
        bytes32 certHash;   // The digital fingerprint of the document
        address issuedTo;   // Wallet address of the student
        address issuedBy;   // Wallet address of the issuer (university)
        uint256 issuedAt;   // Timestamp when it was created
        bool revoked;       // Flag to check if it's still valid
    }

    // A map to store certificates by their unique ID
    mapping(bytes32 => Certificate) public certificates;
    // A whitelist of addresses allowed to issue certificates
    mapping(address => bool) public approvedIssuers;

    // The owner can authorize a new issuer address
    function approveIssuer(address issuer) external onlyOwner {
        approvedIssuers[issuer] = true;
    }

    // Main function to create a new certificate on the blockchain
    function issueCertificate(
        bytes32 certId,
        bytes32 certHash,
        address student
    ) external onlyIssuer {
        // First, make sure this ID hasn't been used before
        require(certificates[certId].issuedAt == 0, "Certificate exists");

        // Save the certificate data
        certificates[certId] = Certificate({
            certHash: certHash,
            issuedTo: student,
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            revoked: false
        });
    }

    // Function to cancel a certificate if there was a mistake
    function revokeCertificate(bytes32 certId) external {
        Certificate storage c = certificates[certId];

        // Make sure the certificate actually exists
        require(c.issuedAt != 0, "Not found");
        
        // Only the original issuer or the contract owner can revoke it
        require(
            msg.sender == c.issuedBy || msg.sender == owner,
            "Not allowed"
        );

        c.revoked = true; // Mark it as revoked
    }

    // Helper function to read certificate details
    function getCertificate(bytes32 certId)
        external
        view
        returns (Certificate memory)
    {
        return certificates[certId];
    }

    // --- Helper functions for digital signatures ---

    // Verify who signed the message
    function verifySignature(bytes32 certHash, bytes memory signature)
        public
        pure
        returns (address)
    {
        return recoverSigner(certHash, signature);
    }

    // Recover the signer's address from the hash and signature
    function recoverSigner(bytes32 hash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        // Add the standard Ethereum prefix to the hash
        bytes32 prefixedHash =
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

        // Split the signature into its three parts
        (bytes32 r, bytes32 s, uint8 v) = _split(signature);

        return ecrecover(prefixedHash, v, r, s);
    }

    // Helper to split the raw signature bytes into r, s, and v
    function _split(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature");

        // Use assembly to extract values directly from memory
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
