# On-Chain Deployment Evidence

Status: **pending secrets** (RPC + deployer key not provided in environment)

## Current blocker
- `RPC_URL` (or `SEPOLIA_RPC_URL`) is missing
- `PRIVATE_KEY` is missing

Checked via:
```bash
node -e "const keys=['PRIVATE_KEY','RPC_URL','RECORDER_RPC_URL','SEPOLIA_RPC_URL']; for (const k of keys) console.log(k, process.env[k] ? 'SET':'MISSING')"
```

## Prepared deploy script
A deploy script is ready:
- `scripts/deploy-sepolia.mjs`

It compiles and deploys:
- `IgrRegistry.sol`
- `GovernanceRegistry.sol`

## Run command (once env is set)
```bash
cd /Users/macmini/workspace/igr-protocol
export SEPOLIA_RPC_URL="https://..."
export PRIVATE_KEY="0x..."
node scripts/deploy-sepolia.mjs | tee simulation/output/onchain/deploy-output.json
```

## Output fields (auto-generated)
- deployer
- igrRegistry.address / txHash / gasUsed / blockNumber
- governanceRegistry.address / txHash / gasUsed / blockNumber

## Next steps after deploy
1. Copy values into this file under final evidence section.
2. Add Sepolia explorer links for tx hashes.
3. If needed, call `setAuthorizedForwarder()` and log tx hash.
4. Execute one `onReport(bytes,bytes)` write and capture event `ResolutionRecorded` tx hash.

---

## Final evidence section (fill after deployment)

### Network
- Chain: Sepolia
- Date:

### IgrRegistry
- Address:
- Deploy tx hash:
- Gas used:

### GovernanceRegistry
- Address:
- Deploy tx hash:
- Gas used:

### Settlement write proof
- Tx hash:
- Gas used:
- Event: `ResolutionRecorded`
