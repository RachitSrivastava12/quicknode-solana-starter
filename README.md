# @quicknode/solana-kit

**The unified TypeScript SDK for every QuickNode Solana add-on.**

One install. One config. Priority fees, Jito bundles, NFT queries, Jupiter swaps, and live streaming — all typed, all in one place.

```bash
npm install @quicknode/solana-kit
```

---

## What Is This?

This is an **npm package for Solana developers**.

Every developer building on Solana using QuickNode has to wire up each add-on manually — read separate docs pages, figure out separate API shapes, write hundreds of lines of boilerplate glue code. This SDK replaces all of that.

**Without this SDK:**
```ts
// ~200 lines of manual code every time:
// - call qn_estimatePriorityFees, parse it
// - figure out which level to pick
// - build SetComputeUnitLimit instruction
// - build SetComputeUnitPrice instruction
// - remove existing compute budget ixs to avoid duplicates
// - simulate to estimate compute units
// - handle retry when blockhash expires
// - confirm and return useful data
```

**With this SDK:**
```ts
const result = await kit.sendSmartTransaction({ transaction, signer });
// That's it. Everything above is handled.
```

---

## Requirements

- Node.js 18+
- A QuickNode Solana endpoint → **free at [dashboard.quicknode.com](https://dashboard.quicknode.com)**

---

## Quickstart

### 1. Install

```bash
npm install @quicknode/solana-kit
```

### 2. Get a QuickNode endpoint

Go to [dashboard.quicknode.com](https://dashboard.quicknode.com) → Create Endpoint → Solana.
Copy the endpoint URL. It looks like:
```
https://your-name.solana-mainnet.quiknode.pro/YOUR_TOKEN/
```

### 3. (Optional) Enable free add-ons

In the QuickNode dashboard → your endpoint → Add-ons tab:
- Enable **Priority Fee API** (free) → unlocks `estimatePriorityFees()` + auto-fees in `sendSmartTransaction()`
- Enable **Metaplex DAS API** (free) → unlocks all NFT query methods

### 4. Create the kit

```ts
import { QNSolanaKit } from '@quicknode/solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: 'https://your-name.solana-mainnet.quiknode.pro/TOKEN/',

  // Tell the SDK which add-ons you've enabled.
  // The SDK works without any — it just shows helpful messages
  // when you call a method that needs an add-on you haven't enabled.
  addOns: {
    priorityFees: true,   // FREE  — Priority Fee API
    das:          true,   // FREE  — Metaplex DAS API
    metis:        false,  // PAID  — Metis (Jupiter Swap)
    liljit:       false,  // PAID  — Lil' JIT (Jito bundles)
    yellowstone:  false,  // PAID  — Yellowstone gRPC
  },
});
```

### 5. Check what's available

```bash
# Probes your endpoint and shows exactly which add-ons are active
npm run check
```

Output:
```
@quicknode/solana-kit — Add-on Status
──────────────────────────────────────────────────────
Endpoint: https://your-name.solana-mainnet.quiknode.pro...

✓ Priority Fee API [FREE]
  enabled — Dynamic priority fee estimation for faster tx inclusion

✓ Metaplex DAS API [FREE]
  enabled — Query NFTs, compressed NFTs, token metadata

✗ Metis — Jupiter V6 Swap API [PAID]
  not enabled — Best-price token swaps via Jupiter aggregator
  Enable: https://marketplace.quicknode.com/add-ons/metis-jupiter-v6-swap-api

Features Available:
  ✓  Smart Transactions (auto fees + retry)
  ✓  NFT / Digital Asset Queries
  ✗  Jupiter Token Swaps
  ✗  Yellowstone gRPC Streaming
  ✗  Jito Bundle (MEV protection)
  ✓  WebSocket Streaming (slot/account/logs)
```

---

## Add-on Tiers

| Add-on | Tier | What it unlocks |
|---|---|---|
| Priority Fee API | **FREE** | `estimatePriorityFees()`, auto-fees in `sendSmartTransaction()` |
| Metaplex DAS API | **FREE** | `getAssetsByOwner()`, `getAsset()`, `searchAssets()`, `getAssetProof()` |
| Metis (Jupiter Swap) | **PAID** | `swap()`, `getSwapQuote()` |
| Lil' JIT (Jito) | **PAID** | `sendSmartTransaction({ options: { useJito: true } })` |
| Yellowstone gRPC | **PAID** | `watchAccount()` uses gRPC instead of WebSocket |

**Everything except swaps and Jito works on free tier.**
WebSocket streaming (`watchAccount`, `watchProgram`, `watchSlot`) works out of the box with no add-ons.

---

## API Reference

### `kit.sendSmartTransaction(params)`

Send a transaction with automatic priority fees, compute unit optimization, and retry.

```ts
const result = await kit.sendSmartTransaction({
  transaction: myTx,    // your @solana/web3.js Transaction
  signer:      keypair, // Keypair that signs + pays fees
  options: {
    feeLevel:      'recommended', // 'low'|'medium'|'recommended'|'high'|'extreme'
    useJito:       false,         // true = Jito bundle (requires liljit add-on)
    maxRetries:    5,             // retries on blockhash expiry
    simulateFirst: true,          // simulate to right-size compute units
  },
});

console.log(result.signature);               // 'abc123...'
console.log(result.slot);                    // 320481923
console.log(result.priorityFeeMicroLamports); // 5000
console.log(result.computeUnitsUsed);        // 12500
console.log(result.confirmationMs);          // 843
```

---

### `kit.prepareSmartTransaction(params)`

Same as `sendSmartTransaction` but returns the prepared transaction without sending.
**Use this with wallet adapters** (Phantom, Backpack, etc.) where you don't hold the key.

```ts
const { transaction } = await kit.prepareSmartTransaction({
  transaction: myTx,
  payer:       wallet.publicKey,
  options:     { feeLevel: 'high' },
});

// Pass to wallet adapter:
const sig = await wallet.sendTransaction(transaction, kit.connection);
```

---

### `kit.estimatePriorityFees(options?)`

Get current priority fees for all levels.

```ts
const fees = await kit.estimatePriorityFees({
  account:      'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', // optional filter
  lastNBlocks:  100,
});

fees.low          // 500   µlamports/CU
fees.medium       // 1200  µlamports/CU
fees.recommended  // 3000  µlamports/CU
fees.high         // 8000  µlamports/CU
fees.extreme      // 25000 µlamports/CU
fees.networkCongestion // 0.42 (0=quiet, 1=congested)
```

---

### `kit.getAssetsByOwner(options)`

Get all NFTs, cNFTs, and tokens owned by a wallet.

```ts
const { items, total } = await kit.getAssetsByOwner({
  ownerAddress: 'WalletAddress',
  limit:        50,
  sortBy:       'created',
  sortDirection: 'desc',
});

items.forEach(asset => {
  console.log(asset.content.metadata.name);
  console.log(asset.ownership.owner);
  console.log(asset.compression?.compressed); // true = cNFT
});
```

---

### `kit.getAsset(mintAddress)`

Get a single digital asset by mint address.

```ts
const asset = await kit.getAsset('NFTMintAddress');
console.log(asset.content.metadata.name);
console.log(asset.content.metadata.image);
console.log(asset.royalty?.basis_points);
```

---

### `kit.searchAssets(options)`

Search with filters: owner, creator, collection, token type.

```ts
const { items } = await kit.searchAssets({
  ownerAddress: 'WalletAddress',
  tokenType:    'compressedNFT', // only cNFTs
  limit:        100,
});
```

---

### `kit.getAssetProof(assetId)`

Get the Merkle proof for a compressed NFT. Required for cNFT transfers via Bubblegum.

```ts
const proof = await kit.getAssetProof('cNFTAssetId');
// proof.root + proof.proof → use with mpl-bubblegum transfer instruction
```

---

### `kit.getTokenAccounts(walletAddress)`

Get all SPL token accounts and balances for a wallet.

```ts
const tokens = await kit.getTokenAccounts('WalletAddress');
tokens
  .filter(t => t.uiAmount > 0)
  .forEach(t => console.log(`${t.mint}: ${t.uiAmount}`));
```

---

### `kit.watchAccount(address, callback, options?)`

Watch an account for real-time updates. Auto-uses Yellowstone if enabled, WebSocket otherwise.

```ts
const handle = kit.watchAccount('WalletAddress', (update) => {
  console.log('SOL balance:', update.lamports / 1e9);
  console.log('Backend:', update.backend); // 'yellowstone' or 'websocket'
});

// Stop watching:
handle.unsubscribe();
handle.isConnected(); // boolean
```

---

### `kit.watchProgram(programId, callback, options?)`

Watch all transactions for a program in real time.

```ts
const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

const handle = kit.watchProgram(JUPITER, (tx) => {
  if (!tx.err) console.log('Swap:', tx.signature);
});
```

---

### `kit.watchSlot(callback)`

Subscribe to slot updates (~every 400ms). Free tier, no add-ons needed.

```ts
const handle = kit.watchSlot((slot) => {
  process.stdout.write(`\r Slot: ${slot.toLocaleString()}`);
});
```

---

### `kit.getSwapQuote(options)` — PAID (Metis)

Get a Jupiter swap quote without executing.

```ts
import { TOKENS } from '@quicknode/solana-kit';

const quote = await kit.getSwapQuote({
  inputMint:  TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount:     BigInt(1_000_000_000), // 1 SOL
});

console.log(`1 SOL → ${Number(quote.outAmount) / 1e6} USDC`);
console.log(`Price impact: ${quote.priceImpactPct}%`);
```

---

### `kit.swap(options)` — PAID (Metis)

Execute a token swap in one call.

```ts
const result = await kit.swap({
  inputMint:     TOKENS.SOL,
  outputMint:    TOKENS.USDC,
  amount:        BigInt(100_000_000), // 0.1 SOL
  userPublicKey: keypair.publicKey.toString(),
  signer:        keypair,
  slippageBps:   50,   // 0.5%
  feeLevel:      'recommended',
});

console.log('Swapped!', result.signature);
```

Token shortcuts: `TOKENS.SOL`, `TOKENS.USDC`, `TOKENS.USDT`, `TOKENS.BONK`, `TOKENS.JUP`, `TOKENS.RAY`, `TOKENS.WIF`

---

### `kit.checkAddOns()`

Probe your endpoint to see which add-ons are live.

```ts
const status = await kit.checkAddOns();
console.log(status.canUse.smartTransactions); // true/false
console.log(status.canUse.nftQueries);        // true/false
console.log(status.addOns);                   // per-add-on detail
```

---

## Error Handling

Every error is typed and tells you exactly what went wrong and how to fix it.

```ts
import {
  AddOnNotEnabledError,
  TransactionFailedError,
  TransactionTimeoutError,
  MaxRetriesExceededError,
  RPCError,
} from '@quicknode/solana-kit';

try {
  await kit.sendSmartTransaction({ transaction, signer });
} catch (err) {
  if (err instanceof AddOnNotEnabledError) {
    // Clear message with link to enable the add-on in the dashboard
    console.error(err.message);
  } else if (err instanceof TransactionFailedError) {
    // On-chain failure — check logs
    console.error('Failed on-chain:', err.reason);
    console.error('Explorer:', `https://explorer.solana.com/tx/${err.signature}`);
  } else if (err instanceof TransactionTimeoutError) {
    console.error('Timed out. Try a higher feeLevel.');
  } else if (err instanceof MaxRetriesExceededError) {
    console.error(`Failed after ${err.maxRetries} retries.`);
  } else if (err instanceof RPCError) {
    console.error(`RPC ${err.statusCode}:`, err.message);
  }
}
```

---

## Tree-Shaking

Import only what you need for smaller bundles:

```ts
// Individual function imports (fully tree-shakeable)
import { estimatePriorityFees }  from '@quicknode/solana-kit';
import { getAssetsByOwner }      from '@quicknode/solana-kit';
import { watchAccount }          from '@quicknode/solana-kit';
import { swap, TOKENS }          from '@quicknode/solana-kit';
```

---

## Running the Examples

```bash
# Clone and install
git clone https://github.com/quiknode-labs/qn-solana-kit
cd qn-solana-kit
npm install

# Setup environment
cp .env.example .env
# Fill in QN_ENDPOINT_URL (required)
# Fill in WALLET_ADDRESS and WALLET_PRIVATE_KEY for tx/swap examples

# Check which add-ons are active on your endpoint
npm run check

# Run individual examples
npm run example:tx      # Smart transaction (needs Priority Fee API add-on)
npm run example:nft     # NFT queries (needs DAS API add-on)
npm run example:stream  # Live streaming (works on free tier)
npm run example:swap    # Jupiter swap quote (needs Metis add-on)

# Run all
npm run example:all
```

---

## Project Structure

```
src/
  index.ts               ← QNSolanaKit class + all exports
  addons.ts              ← checkAddOns() diagnostic
  types/
    index.ts             ← All TypeScript types
    errors.ts            ← Typed error classes
  utils/
    helpers.ts           ← Connection, sleep, etc.
    http.ts              ← rpcPost, httpGet, httpPost
    addon-guard.ts       ← requireAddOn, isAddOnEnabled
  transactions/
    priority-fees.ts     ← estimatePriorityFees
    smart-transaction.ts ← sendSmartTransaction, prepareSmartTransaction
  assets/
    das.ts               ← getAssetsByOwner, getAsset, searchAssets, etc.
  streaming/
    watcher.ts           ← watchAccount, watchProgram, watchSlot
  swap/
    jupiter.ts           ← swap, getSwapQuote, TOKENS
examples/
  1-smart-transaction.ts
  2-nft-queries.ts
  3-live-streaming.ts
  4-jupiter-swap.ts
  run-all.ts
```

---

## Links

- QuickNode Dashboard: https://dashboard.quicknode.com
- Add-ons Marketplace: https://marketplace.quicknode.com
- Priority Fee API: https://www.quicknode.com/docs/solana/qn_estimatePriorityFees
- Metaplex DAS API: https://www.quicknode.com/docs/solana/getAsset
- Metis (Jupiter): https://marketplace.quicknode.com/add-ons/metis-jupiter-v6-swap-api
- Yellowstone gRPC: https://marketplace.quicknode.com/add-ons/yellowstone-grpc

---

## License

MIT © QuickNode
