import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ONCHAIN_OUT_DIR = path.join(ROOT, 'simulation/output/onchain');

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

const result = {
  network: 'sepolia',
  deployedAt: new Date().toISOString(),
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
};

await mkdir(ONCHAIN_OUT_DIR, { recursive: true });
await writeFile(path.join(ONCHAIN_OUT_DIR, 'deploy-output.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const deployMd = `# On-Chain Deployment Evidence\n\nStatus: **deployed**\n\n## Network\n- Chain: Sepolia\n- Date: ${result.deployedAt}\n- Deployer: ${result.deployer}\n\n## IgrRegistry\n- Address: ${result.igrRegistry.address}\n- Deploy tx hash: ${result.igrRegistry.txHash}\n- Gas used: ${result.igrRegistry.gasUsed}\n- Block number: ${result.igrRegistry.blockNumber}\n\n## GovernanceRegistry\n- Address: ${result.governanceRegistry.address}\n- Deploy tx hash: ${result.governanceRegistry.txHash}\n- Gas used: ${result.governanceRegistry.gasUsed}\n- Block number: ${result.governanceRegistry.blockNumber}\n\n## Raw artifact\n- \`simulation/output/onchain/deploy-output.json\`\n`;

await writeFile(path.join(ONCHAIN_OUT_DIR, 'deploy.md'), deployMd, 'utf8');

console.log(JSON.stringify(result, null, 2));
console.error(`wrote: ${path.join(ONCHAIN_OUT_DIR, 'deploy-output.json')}`);
console.error(`wrote: ${path.join(ONCHAIN_OUT_DIR, 'deploy.md')}`);
