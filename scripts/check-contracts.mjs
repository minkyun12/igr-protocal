import solc from "solc";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function compileOne(fileName, contractName) {
  const source = await readFile(path.join(root, "contracts", fileName), "utf8");
  const input = {
    language: "Solidity",
    sources: { [fileName]: { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };

  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const fatal = (out.errors || []).filter((e) => e.severity === "error");
  if (fatal.length > 0) {
    throw new Error(`${fileName} compile failed:\n${fatal.map((e) => e.formattedMessage || e.message).join("\n")}`);
  }

  if (!out.contracts?.[fileName]?.[contractName]) {
    throw new Error(`${fileName}: contract ${contractName} not found in solc output`);
  }
}

await compileOne("IgrRegistry.sol", "IgrRegistry");
await compileOne("GovernanceRegistry.sol", "GovernanceRegistry");

console.log("contracts:compile:ok");
