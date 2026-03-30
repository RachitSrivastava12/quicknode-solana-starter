# quicknode-solana-kit

Typed Solana SDK for QuickNode endpoints and QuickNode-powered add-ons.

This package gives you one place to work with:

- standard Solana RPC
- standard Solana WebSocket subscriptions
- QuickNode custom JSON-RPC methods
- QuickNode REST add-ons mounted on the same endpoint

If your current Solana setup looks like this:

```ts
import { Connection } from '@solana/web3.js';

const connection = new Connection(
  'https://your-endpoint.quiknode.pro/TOKEN/',
  'confirmed',
);
```

then `quicknode-solana-kit` is the layer on top of that.

It still uses a normal Solana `Connection`, but adds typed helper methods for common QuickNode add-ons and transaction workflows.

```bash
npm install quicknode-solana-kit
```

## What This Package Is

This package is a wrapper around three patterns:

1. normal Solana `Connection` calls from `@solana/web3.js`
2. QuickNode custom RPC methods such as `qn_estimatePriorityFees`
3. QuickNode REST endpoints such as `/jupiter/v6/quote`

It does not replace Solana RPC. It organizes it.

You get:

- `kit.connection` for normal Solana calls
- `kit.someMethod()` for QuickNode helper methods

Example:

```ts
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: 'https://your-endpoint.quiknode.pro/TOKEN/',
});

const slot = await kit.connection.getSlot();
console.log(slot);
```

## Install

```bash
npm install quicknode-solana-kit
```

Requirements:

- Node.js 18+
- a QuickNode Solana endpoint

## Quick Start

### 1. Create the kit

```ts
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: 'https://your-endpoint.quiknode.pro/TOKEN/',
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

### 2. Use normal Solana methods

```ts
import { PublicKey } from '@solana/web3.js';

const wallet = new PublicKey('E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk');

const balance = await kit.connection.getBalance(wallet);
const slot = await kit.connection.getSlot();
const blockhash = await kit.connection.getLatestBlockhash();

console.log(balance, slot, blockhash.blockhash);
```

### 3. Use kit helper methods

```ts
const tokenAccounts = await kit.getTokenAccounts(wallet.toString());
console.log(tokenAccounts.length);
```

### 4. Check which add-ons are live

```ts
const status = await kit.checkAddOns();
console.log(status.addOns);
console.log(status.canUse);
```

CLI:

```bash
npm run check
```

## Can You Still Use Built-In Solana `Connection` Methods?

Yes.

This is one of the most important points in the whole package.

`kit.connection` is a real `Connection` instance from `@solana/web3.js`.

That means you can still use methods like:

```ts
const version = await kit.connection.getVersion();
const slot = await kit.connection.getSlot();
const balance = await kit.connection.getBalance(walletPublicKey);
const blockhash = await kit.connection.getLatestBlockhash();
const tx = await kit.connection.getTransaction(signature, {
  maxSupportedTransactionVersion: 0,
});
```

So the mental model is:

- `kit.connection` = normal Solana SDK access
- `kit.someMethod()` = helper wrapper provided by this package

## Add-On Model

Some methods work without add-ons.

Some methods require a specific QuickNode add-on.

This package handles add-ons in two ways:

### 1. Local config guard

You tell the SDK what you believe is enabled:

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

If you explicitly set an add-on to `false` and call a method that needs it, the SDK throws an `AddOnNotEnabledError`.

If a value is left `undefined`, the SDK warns and still attempts the network call.

### 2. Real endpoint probe

`checkAddOns()` performs real test calls to your endpoint and tells you what is actually live.

```ts
const result = await kit.checkAddOns();

console.log(result.canUse.smartTransactions);
console.log(result.canUse.nftQueries);
console.log(result.canUse.swaps);
console.log(result.canUse.goldRushData);
console.log(result.canUse.riskAssessment);
```

## How This SDK Talks To QuickNode

There are three backend styles used in this package.

### 1. Standard Solana RPC

Example:

```ts
await kit.connection.getBalance(pubkey);
```

### 2. QuickNode Custom JSON-RPC

Example:

```ts
await kit.estimatePriorityFees();
```

Internally, that becomes a JSON-RPC request similar to:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "qn_estimatePriorityFees",
  "params": {
    "last_n_blocks": 100,
    "api_version": 2
  }
}
```

### 3. QuickNode REST Add-On Route

Example:

```ts
await kit.getSwapQuote({
  inputMint: TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount: BigInt(1_000_000_000),
});
```

Internally, that calls a route like:

```txt
https://your-endpoint.quiknode.pro/TOKEN/jupiter/v6/quote?...
```

## Full Method Count

The `QNSolanaKit` class currently exposes **33 methods**.

They are:

1. `checkAddOns()`
2. `sendSmartTransaction()`
3. `prepareSmartTransaction()`
4. `estimatePriorityFees()`
5. `getAssetsByOwner()`
6. `getAsset()`
7. `getAssetsByCollection()`
8. `searchAssets()`
9. `getAssetProof()`
10. `getTokenAccounts()`
11. `watchAccount()`
12. `watchProgram()`
13. `watchSlot()`
14. `getSwapQuote()`
15. `swap()`
16. `getPumpFunTokens()`
17. `getPumpFunToken()`
18. `getPumpFunTokensByCreator()`
19. `getPumpFunTokenHolders()`
20. `getPumpFunTokenTrades()`
21. `getStablecoinBalance()`
22. `getOpenOceanQuote()`
23. `openOceanSwap()`
24. `sendMerkleProtectedTransaction()`
25. `sendBlinkLabsTransaction()`
26. `sendIrisTransaction()`
27. `getGoldRushBalances()`
28. `getGoldRushTransactions()`
29. `getTitanSwapQuote()`
30. `titanSwap()`
31. `subscribeTitanQuotes()`
32. `assessWalletRisk()`
33. `isWalletSafe()`

Also important:

- `kit.connection` is a property, not a method
- but it gives you access to normal Solana `Connection` methods

## Add-On Requirements Table

| Method | What it does | Add-on needed? | Add-on name |
|---|---|---|---|
| `checkAddOns()` | probes endpoint capabilities | No | none |
| `sendSmartTransaction()` | sends a tx with fee/compute helpers | No, but better with add-on | `priorityFees` recommended |
| `prepareSmartTransaction()` | prepares a tx with fee/compute helpers | No, but better with add-on | `priorityFees` recommended |
| `estimatePriorityFees()` | gets live priority fee estimates | Yes | `priorityFees` |
| `getAssetsByOwner()` | gets wallet assets | Yes | `das` |
| `getAsset()` | gets one digital asset | Yes | `das` |
| `getAssetsByCollection()` | gets assets by collection | Yes | `das` |
| `searchAssets()` | searches digital assets | Yes | `das` |
| `getAssetProof()` | gets compressed NFT proof | Yes | `das` |
| `getTokenAccounts()` | gets SPL token accounts | No | none |
| `watchAccount()` | watches one account | No | none |
| `watchProgram()` | watches program logs | No | none |
| `watchSlot()` | watches slot changes | No | none |
| `getSwapQuote()` | gets Jupiter quote | Yes | `metis` |
| `swap()` | performs Jupiter swap | Yes | `metis` |
| `getPumpFunTokens()` | gets recent pump.fun tokens | Yes | `pumpfun` |
| `getPumpFunToken()` | gets one pump.fun token | Yes | `pumpfun` |
| `getPumpFunTokensByCreator()` | gets pump.fun tokens by creator | Yes | `pumpfun` |
| `getPumpFunTokenHolders()` | gets token holders | Yes | `pumpfun` |
| `getPumpFunTokenTrades()` | gets recent token trades | Yes | `pumpfun` |
| `getStablecoinBalance()` | gets stablecoin balances across chains | Yes | `stablecoinBalance` |
| `getOpenOceanQuote()` | gets OpenOcean quote | Yes | `openocean` |
| `openOceanSwap()` | performs OpenOcean swap | Yes | `openocean` |
| `sendMerkleProtectedTransaction()` | sends tx through Merkle | Yes | `merkle` |
| `sendBlinkLabsTransaction()` | sends tx through Blink Labs | Yes | `blinklabs` |
| `sendIrisTransaction()` | sends tx through Iris | Yes | `iris` |
| `getGoldRushBalances()` | gets balances through GoldRush | Yes | `goldrush` |
| `getGoldRushTransactions()` | gets tx history through GoldRush | Yes | `goldrush` |
| `getTitanSwapQuote()` | gets Titan quote | Yes | `titan` |
| `titanSwap()` | performs Titan swap | Yes | `titan` |
| `subscribeTitanQuotes()` | subscribes to Titan quote stream | Yes | `titan` |
| `assessWalletRisk()` | gets Scorechain risk report | Yes | `scorechain` |
| `isWalletSafe()` | returns simple safe/unsafe boolean | Yes | `scorechain` |

## Which Features Need No Add-On?

These work without add-ons:

- `checkAddOns()`
- `sendSmartTransaction()` with fallback behavior
- `prepareSmartTransaction()` with fallback behavior
- `getTokenAccounts()`
- `watchAccount()`
- `watchProgram()`
- `watchSlot()`
- all built-in `kit.connection.*` methods

## Which Add-On Unlocks What?

### `priorityFees`

Unlocks:

- `estimatePriorityFees()`
- improved `sendSmartTransaction()`
- improved `prepareSmartTransaction()`

### `das`

Unlocks:

- `getAssetsByOwner()`
- `getAsset()`
- `getAssetsByCollection()`
- `searchAssets()`
- `getAssetProof()`

### `metis`

Unlocks:

- `getSwapQuote()`
- `swap()`

### `pumpfun`

Unlocks:

- `getPumpFunTokens()`
- `getPumpFunToken()`
- `getPumpFunTokensByCreator()`
- `getPumpFunTokenHolders()`
- `getPumpFunTokenTrades()`

### `stablecoinBalance`

Unlocks:

- `getStablecoinBalance()`

### `openocean`

Unlocks:

- `getOpenOceanQuote()`
- `openOceanSwap()`

### `merkle`

Unlocks:

- `sendMerkleProtectedTransaction()`

### `blinklabs`

Unlocks:

- `sendBlinkLabsTransaction()`

### `iris`

Unlocks:

- `sendIrisTransaction()`

### `goldrush`

Unlocks:

- `getGoldRushBalances()`
- `getGoldRushTransactions()`

### `titan`

Unlocks:

- `getTitanSwapQuote()`
- `titanSwap()`
- `subscribeTitanQuotes()`

### `scorechain`

Unlocks:

- `assessWalletRisk()`
- `isWalletSafe()`

## API Reference

### `checkAddOns()`

Checks which add-ons are actually enabled on your endpoint.

Add-on required: none

```ts
const result = await kit.checkAddOns();

console.log(result.addOns);
console.log(result.canUse.smartTransactions);
console.log(result.canUse.nftQueries);
console.log(result.canUse.swaps);
```

How it works:

- performs real probe calls to your endpoint
- tests both RPC-based and REST-based add-ons
- returns a structured capability report

### `sendSmartTransaction({ transaction, signer, options })`

Sends a transaction with helper logic for compute units, priority fees, and retry behavior.

Add-on required: none, but `priorityFees` is strongly recommended

```ts
import bs58 from 'bs58';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: signer.publicKey,
    lamports: Math.floor(0.001 * LAMPORTS_PER_SOL),
  }),
);

const result = await kit.sendSmartTransaction({
  transaction: tx,
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

What it does internally:

1. optionally simulates the transaction
2. estimates compute units
3. tries to fetch priority fee recommendations
4. injects compute budget instructions
5. gets a blockhash
6. signs the transaction
7. sends raw transaction
8. confirms it
9. retries on failure

Important note:

- if fee estimation fails, it falls back to a default compute unit price
- `useJito` exists in options, but Jito routing is not currently wired into this method

### `prepareSmartTransaction({ transaction, payer, options })`

Prepares a transaction but does not send it.

Add-on required: none, but `priorityFees` is strongly recommended

This is useful for wallet-adapter flows.

```ts
const prepared = await kit.prepareSmartTransaction({
  transaction: myTx,
  payer: wallet.publicKey,
  options: {
    feeLevel: 'high',
    computeUnitBuffer: 10,
  },
});

console.log(prepared.priorityFeeMicroLamports);
console.log(prepared.computeUnits);

const sig = await wallet.sendTransaction(prepared.transaction, kit.connection);
console.log(sig);
```

How it works:

- gets priority fee if available
- adds compute budget instructions
- fetches a recent blockhash
- sets the fee payer
- returns the prepared transaction

### `estimatePriorityFees(options?)`

Gets live priority fee estimates from QuickNode.

Add-on required: `priorityFees`

```ts
const fees = await kit.estimatePriorityFees({
  lastNBlocks: 100,
});

console.log(fees.low);
console.log(fees.medium);
console.log(fees.recommended);
console.log(fees.high);
console.log(fees.extreme);
console.log(fees.networkCongestion);
```

With account filter:

```ts
const fees = await kit.estimatePriorityFees({
  account: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  lastNBlocks: 50,
});
```

How it works:

- calls QuickNode custom RPC method `qn_estimatePriorityFees`
- maps response to fee levels

### `getAssetsByOwner(options)`

Gets digital assets owned by a wallet.

Add-on required: `das`

```ts
const assets = await kit.getAssetsByOwner({
  ownerAddress: 'WALLET_ADDRESS',
  limit: 10,
  page: 1,
});

console.log(assets.total);

for (const item of assets.items) {
  console.log(item.id);
  console.log(item.content.metadata.name);
  console.log(item.ownership.owner);
  console.log(item.compression?.compressed);
}
```

How it works:

- calls DAS RPC method `getAssetsByOwner`

### `getAsset(mintAddress)`

Gets one digital asset.

Add-on required: `das`

```ts
const asset = await kit.getAsset('ASSET_ID_OR_MINT');

console.log(asset.id);
console.log(asset.content.metadata.name);
console.log(asset.content.metadata.symbol);
console.log(asset.content.metadata.image);
```

How it works:

- calls DAS RPC method `getAsset`

### `getAssetsByCollection(options)`

Gets assets by collection.

Add-on required: `das`

```ts
const collectionAssets = await kit.getAssetsByCollection({
  collectionMint: 'COLLECTION_MINT',
  limit: 20,
  page: 1,
});

console.log(collectionAssets.total);
```

How it works:

- calls DAS RPC method `getAssetsByGroup`
- uses collection grouping

### `searchAssets(options)`

Searches digital assets with filters.

Add-on required: `das`

By owner:

```ts
const result = await kit.searchAssets({
  ownerAddress: 'WALLET_ADDRESS',
  limit: 25,
});
```

By creator:

```ts
const result = await kit.searchAssets({
  creatorAddress: 'CREATOR_ADDRESS',
  limit: 25,
});
```

By collection:

```ts
const result = await kit.searchAssets({
  collection: 'COLLECTION_MINT',
  limit: 25,
});
```

Compressed NFTs only:

```ts
const result = await kit.searchAssets({
  tokenType: 'compressedNFT',
  compressed: true,
  limit: 25,
});
```

How it works:

- builds a DAS search request
- calls DAS RPC method `searchAssets`

### `getAssetProof(assetId)`

Gets the Merkle proof for a compressed NFT.

Add-on required: `das`

```ts
const proof = await kit.getAssetProof('ASSET_ID');

console.log(proof.root);
console.log(proof.proof);
console.log(proof.tree_id);
```

How it works:

- calls DAS RPC method `getAssetProof`

### `getTokenAccounts(walletAddress)`

Gets SPL token accounts and balances for a wallet.

Add-on required: none

```ts
const tokens = await kit.getTokenAccounts('WALLET_ADDRESS');

for (const token of tokens) {
  if (token.uiAmount > 0) {
    console.log(token.mint, token.uiAmount);
  }
}
```

How it works:

- calls normal Solana RPC method `getTokenAccountsByOwner`
- uses `jsonParsed` encoding

### `watchAccount(address, onUpdate, options?)`

Watches an account in real time.

Add-on required: none

```ts
const handle = kit.watchAccount('WALLET_ADDRESS', (update) => {
  console.log(update.pubkey);
  console.log(update.lamports);
  console.log(update.owner);
  console.log(update.slot);
  console.log(update.backend);
});

setTimeout(() => {
  console.log(handle.isConnected());
  handle.unsubscribe();
}, 15000);
```

How it works:

- uses Solana websocket subscriptions through `Connection`
- if `yellowstone` is set, the code prefers that route
- current implementation falls back to standard websocket behavior

### `watchProgram(programId, onTx, options?)`

Watches program logs in real time.

Add-on required: none

```ts
const handle = kit.watchProgram(
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  (tx) => {
    console.log(tx.signature);
    console.log(tx.logs);
    console.log(tx.err);
  },
);
```

How it works:

- uses `connection.onLogs(...)`

### `watchSlot(onSlot)`

Watches slot changes.

Add-on required: none

```ts
const handle = kit.watchSlot((slot) => {
  console.log(slot);
});

setTimeout(() => handle.unsubscribe(), 10000);
```

How it works:

- uses `connection.onSlotChange(...)`

### `getSwapQuote(options)`

Gets a Jupiter quote through the Metis add-on.

Add-on required: `metis`

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

How it works:

- calls REST route `/jupiter/v6/quote`

### `swap(options)`

Performs a Jupiter swap through Metis.

Add-on required: `metis`

```ts
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { TOKENS } from 'quicknode-solana-kit';

const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY!));

const result = await kit.swap({
  inputMint: TOKENS.SOL,
  outputMint: TOKENS.USDC,
  amount: BigInt(10_000_000),
  userPublicKey: signer.publicKey.toString(),
  signer,
  slippageBps: 100,
  feeLevel: 'recommended',
});

console.log(result.signature);
console.log(result.inputAmount);
console.log(result.outputAmount);
console.log(result.priceImpactPct);
```

How it works:

1. gets a quote
2. requests a serialized swap transaction
3. deserializes the base64 transaction
4. signs locally
5. sends with normal Solana connection
6. confirms the result

### `getPumpFunTokens(options?)`

Gets recent pump.fun tokens.

Add-on required: `pumpfun`

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

How it works:

- calls REST route `/pump-fun/coins`

### `getPumpFunToken(mint)`

Gets a single pump.fun token by mint.

Add-on required: `pumpfun`

```ts
const token = await kit.getPumpFunToken('TOKEN_MINT');

console.log(token.name);
console.log(token.symbol);
console.log(token.creator);
console.log(token.price);
```

How it works:

- calls REST route `/pump-fun/coins/:mint`

### `getPumpFunTokensByCreator(options)`

Gets pump.fun tokens by creator wallet.

Add-on required: `pumpfun`

```ts
const created = await kit.getPumpFunTokensByCreator({
  creator: 'CREATOR_WALLET',
  limit: 20,
  offset: 0,
});
```

How it works:

- calls `/pump-fun/coins?creator=...`

### `getPumpFunTokenHolders(mint)`

Gets holder distribution for a token.

Add-on required: `pumpfun`

```ts
const holders = await kit.getPumpFunTokenHolders('TOKEN_MINT');

for (const holder of holders.slice(0, 10)) {
  console.log(holder.address, holder.balance, holder.percentage);
}
```

How it works:

- calls REST route `/pump-fun/coins/:mint/holders`

### `getPumpFunTokenTrades(mint, options?)`

Gets recent trades for a token.

Add-on required: `pumpfun`

```ts
const trades = await kit.getPumpFunTokenTrades('TOKEN_MINT', {
  limit: 25,
  offset: 0,
});

for (const trade of trades) {
  console.log(trade.signature, trade.isBuy, trade.solAmount, trade.tokenAmount);
}
```

How it works:

- calls REST route `/pump-fun/trades/all`

### `getStablecoinBalance(options)`

Gets stablecoin balances across multiple chains.

Add-on required: `stablecoinBalance`

```ts
const balances = await kit.getStablecoinBalance({
  walletAddress: 'WALLET_ADDRESS',
  chains: ['solana', 'ethereum', 'base'],
});

console.log(balances.totalUsdValue);

for (const balance of balances.balances) {
  console.log(balance.chain, balance.symbol, balance.balance, balance.usdValue);
}
```

How it works:

- calls custom RPC method `qn_getWalletStablecoinBalances`

### `getOpenOceanQuote(options)`

Gets a swap quote from OpenOcean.

Add-on required: `openocean`

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

How it works:

- calls REST route `/openocean/v4/solana/quote`

### `openOceanSwap(options)`

Performs a swap through OpenOcean.

Add-on required: `openocean`

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

How it works:

1. requests serialized transaction from add-on
2. decodes base64 transaction
3. signs locally
4. sends using normal Solana connection
5. confirms it

### `sendMerkleProtectedTransaction(options)`

Sends a signed transaction through Merkle for MEV protection.

Add-on required: `merkle`

```ts
const result = await kit.sendMerkleProtectedTransaction({
  serializedTransaction: signedTxBase64,
  tipLamports: 10_000,
});

console.log(result.signature);
console.log(result.provider);
```

How it works:

- calls custom RPC method `mev_sendTransaction`
- confirms with normal Solana connection

### `sendBlinkLabsTransaction(options)`

Sends a signed transaction through Blink Labs.

Add-on required: `blinklabs`

```ts
const result = await kit.sendBlinkLabsTransaction({
  serializedTransaction: signedTxBase64,
  tipLamports: 5_000,
});

console.log(result.signature);
console.log(result.provider);
```

How it works:

- calls custom RPC method `blinklabs_sendTransaction`
- confirms with normal Solana connection

### `sendIrisTransaction(options)`

Sends a signed transaction through the Iris add-on.

Add-on required: `iris`

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

How it works:

- calls custom RPC method `iris_sendTransaction`
- confirms with normal Solana RPC

### `getGoldRushBalances(options)`

Gets multichain balances through GoldRush.

Add-on required: `goldrush`

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

How it works:

- calls REST route under `/goldrush/v1/`

### `getGoldRushTransactions(options)`

Gets multichain transaction history through GoldRush.

Add-on required: `goldrush`

```ts
const txs = await kit.getGoldRushTransactions({
  walletAddress: 'WALLET_ADDRESS',
  chain: 'solana-mainnet',
  pageSize: 25,
  pageNumber: 0,
});

for (const tx of txs.items) {
  console.log(tx.txHash, tx.successful, tx.value);
}
```

How it works:

- calls REST route under `/goldrush/v1/`

### `getTitanSwapQuote(options)`

Gets a swap quote from Titan.

Add-on required: `titan`

```ts
const quote = await kit.getTitanSwapQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '1000000000',
  slippageBps: 50,
});

console.log(quote.inAmount);
console.log(quote.outAmount);
console.log(quote.routes);
```

How it works:

- calls REST route `/titan/v1/quote`

### `titanSwap(options)`

Performs a swap through Titan.

Add-on required: `titan`

```ts
const result = await kit.titanSwap({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '10000000',
  slippageBps: 50,
  userPublicKey: 'WALLET_PUBLIC_KEY',
});

console.log(result.signature);
console.log(result.inAmount);
console.log(result.outAmount);
```

How it works:

1. gets a Titan quote
2. requests a serialized transaction
3. deserializes it
4. sends it through normal Solana connection
5. confirms it

### `subscribeTitanQuotes(options, onQuote, onError?)`

Subscribes to live quote updates from Titan over WebSocket.

Add-on required: `titan`

```ts
const unsubscribe = kit.subscribeTitanQuotes(
  {
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '1000000000',
    slippageBps: 50,
  },
  (quote) => {
    console.log('quote', quote.outAmount);
  },
  (err) => {
    console.error(err);
  },
);

setTimeout(() => unsubscribe(), 15000);
```

How it works:

- opens a WebSocket to the Titan stream route on your endpoint

### `assessWalletRisk(options)`

Gets Scorechain risk information for a wallet.

Add-on required: `scorechain`

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
```

How it works:

- calls REST route `/scorechain/v1/risk`

### `isWalletSafe(address)`

Returns a simple safe/unsafe boolean using Scorechain.

Add-on required: `scorechain`

This returns `true` only when:

- `amlStatus === 'clean'`
- `riskLevel === 'low'`

```ts
const safe = await kit.isWalletSafe('WALLET_ADDRESS');
console.log(safe);
```

How it works:

- first calls `assessWalletRisk()`
- then applies a simple clean + low-risk check

## Token Constants

### `TOKENS`

Useful for Jupiter / Metis examples.

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

### `OO_TOKENS`

Useful for OpenOcean examples.

```ts
import { OO_TOKENS } from 'quicknode-solana-kit';

console.log(OO_TOKENS.SOL);
console.log(OO_TOKENS.USDC);
console.log(OO_TOKENS.USDT);
console.log(OO_TOKENS.BONK);
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

## Included Example Scripts

```bash
npm run example:tx
npm run example:nft
npm run example:stream
npm run example:swap
npm run example:all
```

Suggested `.env` values:

```bash
QN_ENDPOINT_URL=
WALLET_PRIVATE_KEY=
WALLET_ADDRESS=
ADDON_PRIORITY_FEES=true
ADDON_DAS=true
ADDON_METIS=true
EXECUTE_SWAP=false
```

## Recommended Learning Order

If you are new to Solana or QuickNode, this order works well:

1. create `kit`
2. use `kit.connection.getBalance()`
3. use `kit.getTokenAccounts()`
4. run `kit.checkAddOns()`
5. if `priorityFees` is enabled, try `kit.estimatePriorityFees()`
6. if `das` is enabled, try `kit.getAssetsByOwner()`
7. if `metis` is enabled, try `kit.getSwapQuote()`

## Starter Example

```ts
import { PublicKey } from '@solana/web3.js';
import { QNSolanaKit } from 'quicknode-solana-kit';

const kit = new QNSolanaKit({
  endpointUrl: process.env.QN_ENDPOINT_URL!,
  addOns: {
    priorityFees: true,
    das: true,
  },
});

async function main() {
  const wallet = new PublicKey('E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk');

  const balance = await kit.connection.getBalance(wallet);
  console.log('SOL balance:', balance / 1e9);

  const tokenAccounts = await kit.getTokenAccounts(wallet.toString());
  console.log('Token accounts:', tokenAccounts.length);

  const fees = await kit.estimatePriorityFees();
  console.log('Recommended priority fee:', fees.recommended);

  const assets = await kit.getAssetsByOwner({
    ownerAddress: wallet.toString(),
    limit: 5,
  });
  console.log('Assets:', assets.items.length);
}

main().catch(console.error);
```

## Current Limitations

- `yellowstone` is exposed in config and add-on checks, but account streaming currently falls back to standard Solana WebSockets
- `liljit` is probed by `checkAddOns()`, but `sendSmartTransaction()` does not currently route through Jito bundles
- `sendSmartTransaction()` works without `priorityFees`, but falls back to a default compute unit price
- several swap integrations return a serialized transaction that the SDK then signs and sends locally

## Beginner Guide

If you want a more beginner-first walkthrough, see:

- [readmetounderstand.md](/home/rachit/Videos/QuickNode-Starter-Kit/qn-solana-kit-v2/readmetounderstand.md)

## License

MIT
