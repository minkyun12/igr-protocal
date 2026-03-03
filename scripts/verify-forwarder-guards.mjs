import fs from "node:fs/promises";

const src = await fs.readFile(new URL("../contracts/IgrRegistry.sol", import.meta.url), "utf8");

function mustContain(pattern, label) {
  if (!pattern.test(src)) {
    throw new Error(`Missing guard: ${label}`);
  }
}

mustContain(/modifier\s+onlyAuthorized\s*\(\)\s*\{[\s\S]*?authorizedForwarder[\s\S]*?\}/m, "onlyAuthorized modifier");
mustContain(/function\s+onReport\s*\([^)]*\)\s*external\s+onlyAuthorized/m, "onReport onlyAuthorized");
mustContain(/function\s+record\s*\([^)]*\)\s*external\s+onlyAuthorized/m, "record onlyAuthorized");
mustContain(/function\s+setAuthorizedForwarder\s*\([^)]*\)\s*external\s+onlyOwner/m, "setAuthorizedForwarder onlyOwner");

console.log("forwarder-guards:ok");
