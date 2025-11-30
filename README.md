# Blockchain Certificate Registry

This project is a decentralized certificate registry built using Solidity, HTML/JS, and MetaMask.  
It allows issuing, verifying, and revoking certificates securely on the blockchain.

## Features
- Issue certificates (stored as bytes32 hashes)
- Verify certificates
- Revoke certificates
- MetaMask digital signatures for authenticity
- Full on-chain transparency

## Security Design
- Certificates are converted into bytes32 hashes before being stored.
- The real certificate ID is never placed on the blockchain.
- Hashing ensures that no one can reverse or guess the original value.
- MetaMask signer ensures that the issuer is genuine.

## Smart Contract
The contract supports:
- `issueCertificate(bytes32 certHash)`
- `verifyCertificate(bytes32 certHash)`
- `revokeCertificate(bytes32 certHash)`

## Frontend
Built with:
- HTML / CSS
- JavaScript
- Ethers.js
- MetaMask integration

Frontend allows users to:
- Enter certificate ID
- Issue it
- Verify it
- Revoke it
- Display results instantly

## How to Run
1. Start the Local Blockchain
2. Deploy contract on Remix or Hardhat.
3. Start the Frontend Application
4. Open `index.html` in browser.
5. Connect MetaMask and interact.

## Testing
Tested with following checks:
- Issue valid certificate
- Verify correct ID → success
- Verify wrong ID → failure
- Revoke issued certificate
- Verify again → fails (as we expected)

## GitHub
All files included:
- Smart contract (`CertificateRegistry.sol`)
- Front-end (`index.html`)
- Deployment script
- README
