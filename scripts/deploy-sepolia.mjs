import { readFile } from 'node:fs/promises';
import solc from 'solc';
import { ethers } from 'ethers';

const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  console.error('Missing RPC_URL/SEPOLIA_RPC_URL or PRIVATE_KEY');
  process.exit(1);
}

function compile(fileName, contractName) {
  return readFile(new URL(`../contracts/${fileName}`, import.meta.url), 'utf8').then((source) => {
    const input = {
      language: 'Solidity',
      sources: { [fileName]: { content: source } },
      settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors) {
      const fatal = output.errors.filter(e => e.severity === 'error');
      if (fatal.length) {
        console.error(fatal);
        process.exit(1);
      }
    }
    const c = output.contracts[fileName][contractName];
    return { abi: c.abi, bytecode: '0x' + c.evm.bytecode.object };
  });
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const govCompiled = await compile('GovernanceRegistry.sol', 'GovernanceRegistry');
const igrCompiled = await compile('IgrRegistry.sol', 'IgrRegistry');

console.log('Deployer:', wallet.address);

const IgrFactory = new ethers.ContractFactory(igrCompiled.abi, igrCompiled.bytecode, wallet);
const igr = await IgrFactory.deploy(wallet.address);
const igrReceipt = await igr.deploymentTransaction().wait();

const GovFactory = new ethers.ContractFactory(govCompiled.abi, govCompiled.bytecode, wallet);
const gov = await GovFactory.deploy();
const govReceipt = await gov.deploymentTransaction().wait();

console.log(JSON.stringify({
  network: 'sepolia',
  deployer: wallet.address,
  igrRegistry: {
    address: await igr.getAddress(),
    txHash: igr.deploymentTransaction().hash,
    gasUsed: igrReceipt.gasUsed.toString(),
    blockNumber: igrReceipt.blockNumber
  },
  governanceRegistry: {
    address: await gov.getAddress(),
    txHash: gov.deploymentTransaction().hash,
    gasUsed: govReceipt.gasUsed.toString(),
    blockNumber: govReceipt.blockNumber
  }
}, null, 2));
