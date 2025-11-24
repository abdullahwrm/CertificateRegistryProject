// ======================
// Connect to MetaMask
// ======================
let provider;
let signer;
let contract;
let issuedCertIds = []; // Keep track of issued certificate IDs

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ======================
// ABI (from artifacts/.../CertificateRegistry.json)
// ======================
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "issuer", "type": "address" }
    ],
    "name": "approveIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "approvedIssuers",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "name": "certificates",
    "outputs": [
      { "internalType": "bytes32", "name": "certHash", "type": "bytes32" },
      { "internalType": "address", "name": "issuedTo", "type": "address" },
      { "internalType": "address", "name": "issuedBy", "type": "address" },
      { "internalType": "uint256", "name": "issuedAt", "type": "uint256" },
      { "internalType": "bool", "name": "revoked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "certId", "type": "bytes32" },
      { "internalType": "bytes32", "name": "certHash", "type": "bytes32" },
      { "internalType": "address", "name": "student", "type": "address" }
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "certId", "type": "bytes32" }],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "certId", "type": "bytes32" }],
    "name": "verifyCertificate",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ======================
// Connect Wallet
// ======================
async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask not installed!");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();

    document.getElementById("walletStatus").innerText = "Wallet Connected ✔";

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    console.log("Contract Loaded:", contract);
  } catch (err) {
    console.error(err);
    alert("Failed to connect wallet");
  }
}

// ======================
// Approve Issuer
// ======================
async function approveIssuer() {
  try {
    const issuer = document.getElementById("issuerAddress").value;

    if (!ethers.utils.isAddress(issuer)) {
      alert("Invalid issuer address");
      return;
    }

    const tx = await contract.approveIssuer(issuer);
    await tx.wait();

    alert("Issuer approved!");
  } catch (err) {
    console.error(err);
    alert("Error approving issuer");
  }
}

// ======================
// Issue Certificate
// ======================
async function issueCertificate() {
  try {
    let certId = document.getElementById("certId").value;
    let certHash = document.getElementById("certHash").value;
    let student = document.getElementById("studentAddress").value;

    if (!ethers.utils.isAddress(student)) {
      alert("Invalid student address");
      return;
    }

    // Make sure strings are less than 32 chars
    if (certId.length > 31 || certHash.length > 31) {
      alert("Certificate ID or Hash too long (max 31 chars)");
      return;
    }

    certId = ethers.utils.formatBytes32String(certId);
    certHash = ethers.utils.formatBytes32String(certHash);

    const tx = await contract.issueCertificate(certId, certHash, student);
    await tx.wait();

    // Store issued ID in frontend
    issuedCertIds.push(certId);

    alert("Certificate Issued!");
  } catch (err) {
    console.error(err);
    alert("Error issuing certificate: " + (err?.data?.message || err.message));
  }
}

// ======================
// Verify Certificate
// ======================
async function verifyCertificate() {
  try {
    let id = document.getElementById("verifyId").value;

    if (id.length > 31) {
      alert("Certificate ID too long (max 31 chars)");
      return;
    }

    id = ethers.utils.formatBytes32String(id);

    const valid = await contract.verifyCertificate(id);

    alert(valid ? "VALID Certificate" : "Certificate NOT found");
  } catch (err) {
    console.error(err);
    alert("Error verifying certificate: " + (err?.data?.message || err.message));
  }
}

// ======================
// Revoke Certificate
// ======================
async function revokeCertificate() {
  try {
    let id = document.getElementById("revokeId").value;

    if (id.length > 31) {
      alert("Certificate ID too long (max 31 chars)");
      return;
    }

    id = ethers.utils.formatBytes32String(id);

    const tx = await contract.revokeCertificate(id);
    await tx.wait();

    alert("Certificate Revoked!");
  } catch (err) {
    console.error(err);
    alert("Error revoking certificate: " + (err?.data?.message || err.message));
  }
}

// ======================
// List all issued Certificates
// ======================
async function listCertificates() {
  if (issuedCertIds.length === 0) {
    alert("No certificates issued yet");
    return;
  }

  let output = "Issued Certificates:\n\n";

  for (const id of issuedCertIds) {
    try {
      const cert = await contract.certificates(id);
      const valid = !cert.revoked;
      const idStr = ethers.utils.parseBytes32String(id);
      const hashStr = ethers.utils.parseBytes32String(cert.certHash);
      output += `ID: ${idStr}\nHash: ${hashStr}\nIssued To: ${cert.issuedTo}\nIssued By: ${cert.issuedBy}\nRevoked: ${cert.revoked}\nStatus: ${valid ? "VALID" : "REVOKED"}\n\n`;
    } catch (err) {
      console.error("Error fetching certificate:", id, err);
    }
  }

  alert(output);
}
