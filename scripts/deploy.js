const { ethers } = require("hardhat");

async function main() {
    const Contract = await ethers.getContractFactory("CertificateRegistry");
    const cert = await Contract.deploy();

    console.log("Contract deployed to:", await cert.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
