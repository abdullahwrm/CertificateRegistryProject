const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {

    let Contract, cert, owner, issuer, student;

    beforeEach(async function () {
        [owner, issuer, student] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("CertificateRegistry");
        cert = await Contract.deploy();
    });

    it("should allow owner to approve issuer", async function () {
        await cert.approveIssuer(issuer.address);
        expect(await cert.approvedIssuers(issuer.address)).to.equal(true);
    });

    it("issuer can issue certificate", async function () {
        await cert.approveIssuer(issuer.address);

        const certId = ethers.keccak256(ethers.toUtf8Bytes("ABC123"));
        const certHash = ethers.keccak256(ethers.toUtf8Bytes("My PDF"));

        await cert.connect(issuer).issueCertificate(certId, certHash, student.address);

        const stored = await cert.getCertificate(certId);

        expect(stored.certHash).to.equal(certHash);
        expect(stored.issuedTo).to.equal(student.address);
    });

    it("issuer or owner can revoke certificate", async function () {
        await cert.approveIssuer(issuer.address);

        const certId = ethers.keccak256(ethers.toUtf8Bytes("CERT456"));
        const certHash = ethers.keccak256(ethers.toUtf8Bytes("DATA"));

        await cert.connect(issuer).issueCertificate(certId, certHash, student.address);

        await cert.connect(issuer).revokeCertificate(certId);

        const stored = await cert.getCertificate(certId);
        expect(stored.revoked).to.equal(true);
    });

    it("verifies signature correctly", async function () {
        const hash = ethers.keccak256(ethers.toUtf8Bytes("HASH DATA"));
        const signature = await issuer.signMessage(ethers.getBytes(hash));

        const recovered = await cert.verifySignature(hash, signature);

        expect(recovered).to.equal(issuer.address);
    });
});
