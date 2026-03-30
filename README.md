# quicknode-solana-kit

Typed Solana SDK for QuickNode endpoints and QuickNode-powered add-ons.

This package gives you one client for:

- normal Solana RPC via `@solana/web3.js`
- QuickNode custom RPC methods
- QuickNode-mounted REST add-ons
- real-time subscriptions through Solana WebSockets

If all you know today is:

```ts
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://your-endpoint.quiknode.pro/TOKEN/', 'confirmed');
```

this package is the next layer on top of that.

It still uses a normal Solana `Connection`, but wraps common QuickNode features into a single typed API.

```bash
npm install quicknode-solana-kit
```

## What This Package Actually Does

`quicknode-solana-kit` is not a replacement for Solana RPC.

It is a wrapper around three patterns:

1. Standard Solana RPC and WebSocket calls through `@solana/web3.js`
2. QuickNode custom JSON-RPC methods like `qn_estimatePriorityFees`
3. REST-style add-ons mounted on your QuickNode endpoint like `/jupiter/v6/quote`

The package creates a normal Solana `Connection` internally, then adds methods like:

- `sendSmartTransaction()`
- `estimatePriorityFees()`
- `getAssetsByOwner()`
- `getSwapQuote()`
- `getPumpFunTokens()`
- `sendMerkleProtectedTransaction()`
- `getGoldRushBalances()`
- `assessWalletRisk()`

## Install

```bash
npm install quicknode-solana-kit
```

Peer/runtime requirements:

- Node.js 18+
- a QuickNode Solana endpoint

## Quick Start

### 1. Create a QuickNode Solana endpoint

Example endpoint:

```txt
https://your-name.solana-mainnet.quiknode.pro/YOUR_TOKEN/
```

### 2. Create the client

```ts
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: 'https://your-name.solana-mainnet.quiknode.pro/YOUR_TOKEN/',
  commitment: 'confirmed',
  timeout: 30_000,
  addOns: {
    priorityFees: true,
    das: true,
    metis: false,
    yellowstone: false,
    liljit: false,
    pumpfun: false,
    stablecoinBalance: false,
    openocean: false,
    merkle: false,
    blinklabs: false,
    iris: false,
    goldrush: false,
    titan: false,
    scorechain: false,
  },
});
```

### 3. Use the built-in Solana connection

```ts
const blockhash = await kit.connection.getLatestBlockhash();
console.log(blockhash.blockhash);
```

### 4. Probe your endpoint

```ts
const status = await kit.checkAddOns();
console.log(status.addOns);
console.log(status.canUse);
```

You can also run the CLI:

```bash
npm run check
```

## How Add-Ons Work

This package uses add-ons in two ways:

### 1. Local config guard

You declare what you think is enabled:

```ts
const kit = new QNSolanaKit({
  endpointUrl: process.env.QN_ENDPOINT_URL!,
  addOns: {
    priorityFees: true,
    das: true,
    metis: false,
  },
});
```

If you explicitly set an add-on to `false` and call a method that requires it, the SDK throws an `AddOnNotEnabledError`.

If you leave a value `undefined`, the SDK warns and still tries the network call.

### 2. Real endpoint capability

The actual source of truth is your endpoint.

`checkAddOns()` probes the endpoint by making sample RPC or REST calls and returns what is live.

```ts
const result = await kit.checkAddOns();

console.log(result.canUse.smartTransactions);
console.log(result.canUse.nftQueries);
console.log(result.canUse.swaps);
console.log(result.canUse.openOceanSwaps);
console.log(result.canUse.goldRushData);
```

## Add-On Map

Here is how each add-on is implemented inside the package.

| Add-on key | What it unlocks | Transport used by SDK | Example endpoint shape |
|---|---|---|---|
| `priorityFees` | live fee estimation and smart tx fee selection | JSON-RPC | `qn_estimatePriorityFees` |
| `das` | NFT / digital asset queries | JSON-RPC | `getAssetsByOwner` |
| `metis` | Jupiter quote and swap | REST | `/jupiter/v6/quote` |
| `yellowstone` | account streaming preference | currently falls back to WebSocket | no active gRPC client yet |
| `liljit` | intended Jito support | checked by probe, not fully wired into smart tx flow yet | `sendBundle` |
| `pumpfun` | pump.fun market data | REST | `/pump-fun/coins` |
| `stablecoinBalance` | stablecoin balances across chains | JSON-RPC | `qn_getWalletStablecoinBalances` |
| `openocean` | OpenOcean quote and swap | REST | `/openocean/v4/solana/quote` |
| `merkle` | MEV-protected tx submission | JSON-RPC | `mev_sendTransaction` |
| `blinklabs` | alternate protected tx submission | JSON-RPC | `blinklabs_sendTransaction` |
| `iris` | low-latency tx sender | JSON-RPC | `iris_sendTransaction` |
| `goldrush` | multichain balances and tx history | REST | `/goldrush/v1/...` |
| `titan` | swap quote, swap, quote stream | REST + WebSocket | `/titan/v1/quote` |
| `scorechain` | wallet risk checks | REST | `/scorechain/v1/risk` |

## Common Pattern

Most features follow one of these flows.

### Standard Solana RPC

```ts
const accounts = await kit.connection.getTokenAccountsByOwner(
  wallet,
  { programId: TOKEN_PROGRAM_ID },
);
```

### QuickNode custom RPC

The SDK hides the raw method call:

```ts
const fees = await kit.estimatePriorityFees();
```

instead of:

```ts
await fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'qn_estimatePriorityFees',
    params: { last_n_blocks: 100, api_version: 2 },
  }),
});
```

### REST add-on mounted on the same endpoint

The SDK also hides path-building:

```ts
const quote = await kit.getSwapQuote({
  inputMint: TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount: BigInt(1_000_000_000),
});
```

instead of manually calling:

```txt
https://your-endpoint.quiknode.pro/TOKEN/jupiter/v6/quote?...
```

## Client Configuration

```ts
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: process.env.QN_ENDPOINT_URL!,
  commitment: 'confirmed',
  timeout: 30_000,
  addOns: {
    priorityFees: true,
    das: true,
  },
});
```

### Config fields

```ts
interface QNConfig {
  endpointUrl: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  timeout?: number;
  addOns?: {
    priorityFees?: boolean;
    liljit?: boolean;
    das?: boolean;
    metis?: boolean;
    yellowstone?: boolean;
    pumpfun?: boolean;
    stablecoinBalance?: boolean;
    openocean?: boolean;
    merkle?: boolean;
    blinklabs?: boolean;
    iris?: boolean;
    goldrush?: boolean;
    titan?: boolean;
    scorechain?: boolean;
  };
}
```

## API Reference

### Diagnostics

#### `kit.checkAddOns()`

Probes your endpoint and returns add-on availability.

```ts
const status = await kit.checkAddOns();

for (const addon of status.addOns) {
  console.log(addon.name, addon.enabled, addon.tier);
}

console.log(status.canUse.smartTransactions);
console.log(status.canUse.nftQueries);
console.log(status.canUse.swaps);
console.log(status.canUse.pumpFun);
console.log(status.canUse.goldRushData);
console.log(status.canUse.riskAssessment);
```

### Transactions

#### `kit.estimatePriorityFees(options?)`

Requires: `priorityFees`

Gets live priority fee estimates from QuickNode.

```ts
const fees = await kit.estimatePriorityFees();

console.log(fees.low);
console.log(fees.medium);
console.log(fees.recommended);
console.log(fees.high);
console.log(fees.extreme);
console.log(fees.networkCongestion);
```

With an account filter:

```ts
const fees = await kit.estimatePriorityFees({
  account: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  lastNBlocks: 50,
});
```

#### `kit.sendSmartTransaction({ transaction, signer, options })`

Uses:

- Solana simulation to estimate compute units
- QuickNode Priority Fee API when available
- compute budget instruction injection
- retry loop with backoff

Requires: no add-on strictly required, but `priorityFees` makes it much better

```ts
import bs58 from 'bs58';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: process.env.QN_ENDPOINT_URL!,
  addOns: { priorityFees: true },
});

const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: signer.publicKey,
    lamports: Math.floor(0.001 * LAMPORTS_PER_SOL),
  }),
);

const result = await kit.sendSmartTransaction({
  transaction,
  signer,
  options: {
    feeLevel: 'recommended',
    simulateFirst: true,
    maxRetries: 5,
    computeUnitBuffer: 10,
    skipPreflight: false,
  },
});

console.log(result.signature);
console.log(result.slot);
console.log(result.priorityFeeMicroLamports);
console.log(result.computeUnitsUsed);
console.log(result.confirmationMs);
```

#### `kit.prepareSmartTransaction({ transaction, payer, options })`

Prepares a transaction with compute budget instructions and recent blockhash, but does not send it.

This is useful for wallet adapters.

```ts
const prepared = await kit.prepareSmartTransaction({
  transaction: myTransaction,
  payer: wallet.publicKey,
  options: {
    feeLevel: 'high',
    computeUnitBuffer: 10,
  },
});

console.log(prepared.priorityFeeMicroLamports);
console.log(prepared.computeUnits);

const signature = await wallet.sendTransaction(prepared.transaction, kit.connection);
console.log(signature);
```

### Digital Assets and Tokens

#### `kit.getAssetsByOwner(options)`

Requires: `das`

Gets digital assets owned by a wallet.

```ts
const result = await kit.getAssetsByOwner({
  ownerAddress: 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk',
  limit: 10,
  page: 1,
});

console.log(result.total);

for (const asset of result.items) {
  console.log(asset.id);
  console.log(asset.content.metadata.name);
  console.log(asset.ownership.owner);
  console.log(asset.compression?.compressed);
}
```

#### `kit.getAsset(mintAddress)`

Requires: `das`

Gets one asset by id or mint address.

```ts
const asset = await kit.getAsset('NFT_MINT_OR_ASSET_ID');

console.log(asset.id);
console.log(asset.content.metadata.name);
console.log(asset.content.metadata.symbol);
console.log(asset.content.metadata.image);
console.log(asset.royalty?.basis_points);
```

#### `kit.getAssetsByCollection(options)`

Requires: `das`

Gets assets by collection mint.

```ts
const collectionAssets = await kit.getAssetsByCollection({
  collectionMint: 'COLLECTION_MINT',
  limit: 20,
  page: 1,
});

console.log(collectionAssets.total);
console.log(collectionAssets.items.map(item => item.content.metadata.name));
```

#### `kit.searchAssets(options)`

Requires: `das`

Searches by owner, creator, collection, token type, or compressed status.

```ts
const compressed = await kit.searchAssets({
  ownerAddress: 'WALLET_ADDRESS',
  tokenType: 'compressedNFT',
  compressed: true,
  limit: 50,
  page: 1,
});

console.log(compressed.items.length);
```

By creator:

```ts
const created = await kit.searchAssets({
  creatorAddress: 'CREATOR_ADDRESS',
  limit: 25,
});
```

By collection:

```ts
const byCollection = await kit.searchAssets({
  collection: 'COLLECTION_MINT',
  limit: 25,
});
```

#### `kit.getAssetProof(assetId)`

Requires: `das`

Gets the Merkle proof for a compressed asset.

```ts
const proof = await kit.getAssetProof('ASSET_ID');

console.log(proof.root);
console.log(proof.proof);
console.log(proof.tree_id);
```

#### `kit.getTokenAccounts(walletAddress)`

No add-on required.

Gets parsed SPL token accounts using standard Solana RPC.

```ts
const tokenAccounts = await kit.getTokenAccounts('WALLET_ADDRESS');

for (const token of tokenAccounts) {
  if (token.uiAmount > 0) {
    console.log(token.mint, token.uiAmount);
  }
}
```

### Streaming

#### `kit.watchAccount(address, onUpdate, options?)`

No paid add-on required for basic usage.

If `yellowstone` is enabled in config, the package prefers that path, but the current implementation falls back to standard WebSocket subscriptions.

```ts
const handle = kit.watchAccount(
  'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk',
  (update) => {
    console.log(update.pubkey);
    console.log(update.lamports);
    console.log(update.owner);
    console.log(update.slot);
    console.log(update.backend);
  },
  {
    backend: 'auto',
    commitment: 'confirmed',
  },
);

setTimeout(() => {
  console.log(handle.isConnected());
  handle.unsubscribe();
}, 15_000);
```

#### `kit.watchProgram(programId, onTx, options?)`

Watches program logs through Solana WebSockets.

```ts
const handle = kit.watchProgram(
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  (tx) => {
    console.log(tx.signature);
    console.log(tx.logs);
    console.log(tx.err);
  },
  { commitment: 'confirmed' },
);
```

#### `kit.watchSlot(onSlot)`

Watches slot changes.

```ts
const handle = kit.watchSlot((slot) => {
  console.log('slot', slot);
});

setTimeout(() => handle.unsubscribe(), 10_000);
```

### Jupiter / Metis

Requires: `metis`

The SDK builds URLs under your endpoint like:

```txt
https://your-endpoint.quiknode.pro/TOKEN/jupiter/v6/quote
https://your-endpoint.quiknode.pro/TOKEN/jupiter/v6/swap
```

#### `kit.getSwapQuote(options)`

```ts
import { TOKENS } from 'quicknode-solana-kit';

const quote = await kit.getSwapQuote({
  inputMint: TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount: BigInt(1_000_000_000),
  slippageBps: 50,
});

console.log(quote.inAmount);
console.log(quote.outAmount);
console.log(quote.priceImpactPct);
console.log(quote.routePlan);
```

#### `kit.swap(options)`

The SDK flow is:

1. fetch quote
2. request serialized swap transaction
3. deserialize transaction
4. sign locally
5. send with normal Solana connection
6. confirm

```ts
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { QNSolanaKit, TOKENS } from 'quicknode-solana-kit';

const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const kit = new QNSolanaKit({
  endpointUrl: process.env.QN_ENDPOINT_URL!,
  addOns: { metis: true },
});

const swapResult = await kit.swap({
  inputMint: TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount: BigInt(100_000_000),
  userPublicKey: signer.publicKey.toString(),
  signer,
  slippageBps: 50,
  feeLevel: 'recommended',
});

console.log(swapResult.signature);
console.log(swapResult.inputAmount);
console.log(swapResult.outputAmount);
console.log(swapResult.priceImpactPct);
```

#### `TOKENS`

Token shortcuts:

```ts
import { TOKENS } from 'quicknode-solana-kit';

console.log(TOKENS.SOL);
console.log(TOKENS.USDC);
console.log(TOKENS.USDT);
console.log(TOKENS.BONK);
console.log(TOKENS.JUP);
console.log(TOKENS.RAY);
console.log(TOKENS.WIF);
```

### Pump.fun

Requires: `pumpfun`

The SDK uses REST paths under your endpoint:

```txt
/pump-fun/coins
/pump-fun/coins/:mint
/pump-fun/coins/:mint/holders
/pump-fun/trades/all
```

#### `kit.getPumpFunTokens(options?)`

```ts
const tokens = await kit.getPumpFunTokens({
  limit: 10,
  offset: 0,
  includeNsfw: false,
});

for (const token of tokens) {
  console.log(token.mint, token.symbol, token.marketCapSol);
}
```

#### `kit.getPumpFunToken(mint)`

```ts
const token = await kit.getPumpFunToken('TOKEN_MINT');

console.log(token.name);
console.log(token.symbol);
console.log(token.creator);
console.log(token.price);
console.log(token.bondingCurve.complete);
```

#### `kit.getPumpFunTokensByCreator(options)`

```ts
const created = await kit.getPumpFunTokensByCreator({
  creator: 'CREATOR_WALLET',
  limit: 20,
  offset: 0,
});
```

#### `kit.getPumpFunTokenHolders(mint)`

```ts
const holders = await kit.getPumpFunTokenHolders('TOKEN_MINT');

for (const holder of holders.slice(0, 10)) {
  console.log(holder.address, holder.balance, holder.percentage);
}
```

#### `kit.getPumpFunTokenTrades(mint, options?)`

```ts
const trades = await kit.getPumpFunTokenTrades('TOKEN_MINT', {
  limit: 25,
  offset: 0,
});

for (const trade of trades) {
  console.log(trade.signature, trade.isBuy, trade.solAmount, trade.tokenAmount);
}
```

### Stablecoin Balance API

Requires: `stablecoinBalance`

Uses QuickNode custom RPC method `qn_getWalletStablecoinBalances`.

#### `kit.getStablecoinBalance(options)`

```ts
const balances = await kit.getStablecoinBalance({
  walletAddress: 'WALLET_ADDRESS',
  chains: ['solana', 'ethereum', 'base'],
});

console.log(balances.walletAddress);
console.log(balances.totalUsdValue);

for (const balance of balances.balances) {
  console.log(balance.chain, balance.symbol, balance.balance, balance.usdValue);
}
```

### OpenOcean

Requires: `openocean`

The SDK uses REST paths under:

```txt
/openocean/v4/solana/quote
/openocean/v4/solana/swap_quote
```

#### `kit.getOpenOceanQuote(options)`

```ts
const quote = await kit.getOpenOceanQuote({
  inTokenAddress: 'So11111111111111111111111111111111111111112',
  outTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '1000000000',
  slippage: 1,
});

console.log(quote.inAmount);
console.log(quote.outAmount);
console.log(quote.minOutAmount);
console.log(quote.priceImpact);
```

#### `kit.openOceanSwap(options)`

Like the Metis integration, this fetches a serialized transaction, signs locally, sends, then confirms.

```ts
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const result = await kit.openOceanSwap({
  inTokenAddress: 'So11111111111111111111111111111111111111112',
  outTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '10000000',
  slippage: 1,
  userAddress: signer.publicKey.toString(),
  signer,
});

console.log(result.signature);
console.log(result.inAmount);
console.log(result.outAmount);
```

#### `OO_TOKENS`

```ts
import { OO_TOKENS } from 'quicknode-solana-kit';

console.log(OO_TOKENS.SOL);
console.log(OO_TOKENS.USDC);
console.log(OO_TOKENS.USDT);
console.log(OO_TOKENS.BONK);
```

### MEV Protection

These methods accept a base64-encoded signed transaction and submit it through the add-on provider, then confirm using a normal Solana connection.

#### `kit.sendMerkleProtectedTransaction(options)`

Requires: `merkle`

```ts
const result = await kit.sendMerkleProtectedTransaction({
  serializedTransaction: signedTxBase64,
  tipLamports: 10_000,
});

console.log(result.signature);
console.log(result.provider);
console.log(result.confirmationMs);
```

#### `kit.sendBlinkLabsTransaction(options)`

Requires: `blinklabs`

```ts
const result = await kit.sendBlinkLabsTransaction({
  serializedTransaction: signedTxBase64,
  tipLamports: 5_000,
});

console.log(result.signature);
console.log(result.provider);
console.log(result.confirmationMs);
```

### Iris Transaction Sender

Requires: `iris`

Uses QuickNode custom RPC method `iris_sendTransaction`.

#### `kit.sendIrisTransaction(options)`

```ts
const result = await kit.sendIrisTransaction({
  serializedTransaction: signedTxBase64,
  skipPreflight: false,
  maxRetries: 3,
});

console.log(result.signature);
console.log(result.slot);
console.log(result.confirmationMs);
```

### GoldRush

Requires: `goldrush`

Uses REST paths under `/goldrush/v1`.

#### `kit.getGoldRushBalances(options)`

```ts
const balances = await kit.getGoldRushBalances({
  walletAddress: 'WALLET_ADDRESS',
  chain: 'solana-mainnet',
  noSpam: true,
  quoteCurrency: 'USD',
});

console.log(balances.chain);
console.log(balances.address);

for (const item of balances.items) {
  console.log(item.symbol, item.balance, item.usdBalance);
}
```

#### `kit.getGoldRushTransactions(options)`

```ts
const txs = await kit.getGoldRushTransactions({
  walletAddress: 'WALLET_ADDRESS',
  chain: 'solana-mainnet',
  pageSize: 25,
  pageNumber: 0,
});

console.log(txs.currentPage);

for (const tx of txs.items) {
  console.log(tx.txHash, tx.successful, tx.value);
}
```

### Titan

Requires: `titan`

The SDK supports:

- point-in-time quote
- swap execution
- quote streaming over WebSocket

#### `kit.getTitanSwapQuote(options)`

```ts
const quote = await kit.getTitanSwapQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '1000000000',
  slippageBps: 50,
});

console.log(quote.inAmount);
console.log(quote.outAmount);
console.log(quote.minOutAmount);
console.log(quote.routes);
```

#### `kit.titanSwap(options)`

```ts
const result = await kit.titanSwap({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '10000000',
  slippageBps: 50,
  userPublicKey: walletPublicKey,
});

console.log(result.signature);
console.log(result.inAmount);
console.log(result.outAmount);
```

#### `kit.subscribeTitanQuotes(options, onQuote, onError?)`

```ts
const unsubscribe = kit.subscribeTitanQuotes(
  {
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '1000000000',
    slippageBps: 50,
  },
  (quote) => {
    console.log('quote', quote.outAmount, quote.priceImpactPct);
  },
  (err) => {
    console.error(err);
  },
);

setTimeout(() => unsubscribe(), 15_000);
```

### Scorechain

Requires: `scorechain`

Uses REST path `/scorechain/v1/risk`.

#### `kit.assessWalletRisk(options)`

```ts
const assessment = await kit.assessWalletRisk({
  address: 'WALLET_ADDRESS',
  network: 'solana',
});

console.log(assessment.address);
console.log(assessment.riskScore);
console.log(assessment.riskLevel);
console.log(assessment.amlStatus);
console.log(assessment.flags);
console.log(assessment.reportUrl);
```

#### `kit.isWalletSafe(address)`

Returns `true` only when:

- `amlStatus === 'clean'`
- `riskLevel === 'low'`

```ts
const safe = await kit.isWalletSafe('WALLET_ADDRESS');
console.log(safe);
```

## Error Handling

The package exports custom errors:

- `AddOnNotEnabledError`
- `TransactionFailedError`
- `TransactionTimeoutError`
- `MaxRetriesExceededError`
- `InvalidEndpointError`
- `RPCError`

Example:

```ts
import {
  AddOnNotEnabledError,
  RPCError,
  TransactionFailedError,
  MaxRetriesExceededError,
} from 'quicknode-solana-kit';

try {
  await kit.sendSmartTransaction({ transaction, signer });
} catch (err) {
  if (err instanceof AddOnNotEnabledError) {
    console.error('Enable the missing add-on in QuickNode and update kit config.');
  } else if (err instanceof TransactionFailedError) {
    console.error('On-chain failure:', err.signature, err.reason);
  } else if (err instanceof MaxRetriesExceededError) {
    console.error('Retries exhausted:', err.maxRetries);
  } else if (err instanceof RPCError) {
    console.error('RPC error:', err.statusCode, err.message);
  } else {
    console.error(err);
  }
}
```

## Examples Included In The Package

Run the examples from the package folder:

```bash
npm run example:tx
npm run example:nft
npm run example:stream
npm run example:swap
npm run example:all
```

Environment variables used by the examples:

```bash
QN_ENDPOINT_URL=
WALLET_PRIVATE_KEY=
WALLET_ADDRESS=
ADDON_PRIORITY_FEES=true
ADDON_DAS=true
ADDON_METIS=true
EXECUTE_SWAP=false
```

## Minimal Examples

### Minimal client

```ts
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: process.env.QN_ENDPOINT_URL!,
});
```

### Minimal fee estimate

```ts
const fees = await kit.estimatePriorityFees();
console.log(fees.recommended);
```

### Minimal NFT query

```ts
const assets = await kit.getAssetsByOwner({
  ownerAddress: 'WALLET_ADDRESS',
});

console.log(assets.items.length);
```

### Minimal swap quote

```ts
import { TOKENS } from 'quicknode-solana-kit';

const quote = await kit.getSwapQuote({
  inputMint: TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount: BigInt(1_000_000_000),
});

console.log(quote.outAmount);
```

## Notes and Current Limitations

- `yellowstone` is exposed in config and add-on checks, but account streaming currently falls back to standard Solana WebSockets.
- `liljit` is probed by `checkAddOns()`, but `sendSmartTransaction()` does not currently route through Jito bundles yet.
- `sendSmartTransaction()` works without `priorityFees`, but falls back to a default compute unit price.
- some add-ons return serialized transactions; the SDK signs and sends those locally using `@solana/web3.js`

## Import Patterns

Class-based usage:

```ts
import { QNSolanaKit } from 'quicknode-solana-kit';
```

Function-level usage:

```ts
import {
  estimatePriorityFees,
  getAssetsByOwner,
  getSwapQuote,
  swap,
  watchAccount,
  TOKENS,
  OO_TOKENS,
} from 'quicknode-solana-kit';
```

## License

MIT
