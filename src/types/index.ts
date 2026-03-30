// ─────────────────────────────────────────────────────────────
// SDK Config
// ─────────────────────────────────────────────────────────────

export interface QNConfig {
  endpointUrl:  string;
  addOns?: {
    // QuickNode native
    priorityFees?:      boolean;
    liljit?:            boolean;
    das?:               boolean;
    metis?:             boolean;
    yellowstone?:       boolean;
    pumpfun?:           boolean;
    stablecoinBalance?: boolean;
    // Third-party
    openocean?:         boolean;
    merkle?:            boolean;
    blinklabs?:         boolean;
    iris?:              boolean;
    goldrush?:          boolean;
    titan?:             boolean;
    scorechain?:        boolean;
  };
  commitment?: 'processed' | 'confirmed' | 'finalized';
  timeout?:    number;
}

// ─────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────

export type FeeLevel = 'extreme' | 'high' | 'recommended' | 'medium' | 'low';

export interface PriorityFeeOptions {
  account?:      string;
  lastNBlocks?:  number;
}

export interface PriorityFees {
  recommended:       number;
  high:              number;
  extreme:           number;
  medium:            number;
  low:               number;
  networkCongestion: number;
}

export interface SendSmartTxOptions {
  feeLevel?:          FeeLevel;
  useJito?:           boolean;
  maxRetries?:        number;
  simulateFirst?:     boolean;
  computeUnitBuffer?: number;
  skipPreflight?:     boolean;
}

export interface SmartTxResult {
  signature:                string;
  slot:                     number;
  priorityFeeMicroLamports: number;
  computeUnitsUsed:         number;
  jitoBundle:               boolean;
  confirmationMs:           number;
}

// ─────────────────────────────────────────────────────────────
// Digital Assets (DAS)
// ─────────────────────────────────────────────────────────────

export interface GetAssetsByOwnerOptions {
  ownerAddress:  string;
  limit?:        number;
  page?:         number;
  sortBy?:       'created' | 'updated' | 'recent_action';
  sortDirection?: 'asc' | 'desc';
}

export interface GetAssetsByCollectionOptions {
  collectionMint: string;
  limit?:         number;
  page?:          number;
}

export interface SearchAssetsOptions {
  ownerAddress?:   string;
  creatorAddress?: string;
  collection?:     string;
  tokenType?:      'fungible' | 'nonFungible' | 'regularNFT' | 'compressedNFT' | 'all';
  compressed?:     boolean;
  limit?:          number;
  page?:           number;
}

export interface DigitalAsset {
  id:        string;
  interface: string;
  content: {
    json_uri: string;
    metadata: {
      name:         string;
      symbol:       string;
      description?: string;
      image?:       string;
      attributes?:  Array<{ trait_type: string; value: string | number }>;
    };
  };
  ownership: {
    owner:      string;
    frozen:     boolean;
    delegated:  boolean;
    delegate?:  string;
  };
  compression?: {
    compressed:   boolean;
    tree:         string;
    leaf_id:      number;
    seq:          number;
    data_hash:    string;
    creator_hash: string;
    asset_hash:   string;
  };
  royalty?: {
    basis_points:          number;
    percent:               number;
    primary_sale_happened: boolean;
  };
  creators?: Array<{ address: string; share: number; verified: boolean }>;
  grouping?: Array<{ group_key: string; group_value: string }>;
  mutable:   boolean;
  burnt:     boolean;
}

export interface AssetsResult {
  total:  number;
  limit:  number;
  page:   number;
  items:  DigitalAsset[];
}

export interface AssetProof {
  root:       string;
  proof:      string[];
  node_index: number;
  leaf:       string;
  tree_id:    string;
}

export interface TokenAccount {
  mint:         string;
  tokenAccount: string;
  balance:      number;
  decimals:     number;
  uiAmount:     number;
}

// ─────────────────────────────────────────────────────────────
// Streaming
// ─────────────────────────────────────────────────────────────

export type StreamBackend = 'yellowstone' | 'websocket' | 'auto';

export interface WatchOptions {
  backend?:              StreamBackend;
  commitment?:           'processed' | 'confirmed' | 'finalized';
  autoReconnect?:        boolean;
  maxReconnectAttempts?: number;
}

export interface AccountUpdate {
  pubkey:     string;
  lamports:   number;
  owner:      string;
  executable: boolean;
  data:       Buffer;
  slot:       number;
  timestamp:  number;
  backend:    'yellowstone' | 'websocket';
}

export interface ProgramTx {
  signature: string;
  slot:      number;
  blockTime: number;
  logs:      string[];
  err:       object | null;
}

export interface WatchHandle {
  unsubscribe: () => void;
  isConnected: () => boolean;
}

// ─────────────────────────────────────────────────────────────
// Swap
// ─────────────────────────────────────────────────────────────

export interface SwapQuoteOptions {
  inputMint:    string;
  outputMint:   string;
  amount:       bigint;
  slippageBps?: number;
}

export interface SwapOptions extends SwapQuoteOptions {
  userPublicKey: string;
  feeLevel?:     FeeLevel;
  useJitoTip?:   boolean;
}

export interface SwapQuote {
  inputMint:      string;
  outputMint:     string;
  inAmount:       string;
  outAmount:      string;
  priceImpactPct: string;
  slippageBps:    number;
  routePlan:      Array<{
    swapInfo: { label: string; inputMint: string; outAmount: string };
    percent:  number;
  }>;
}

export interface SwapResult {
  signature:      string;
  inputAmount:    bigint;
  outputAmount:   bigint;
  priceImpactPct: number;
  confirmationMs: number;
}

// ─────────────────────────────────────────────────────────────
// Add-on check
// ─────────────────────────────────────────────────────────────

export interface AddOnStatus {
  name:        string;
  enabled:     boolean;
  tier:        'free' | 'paid';
  description: string;
  enableUrl:   string;
}

export interface AddOnCheckResult {
  endpoint:  string;
  addOns:    AddOnStatus[];
  canUse: {
    smartTransactions:  boolean;
    nftQueries:         boolean;
    swaps:              boolean;
    yellowstoneStream:  boolean;
    jitoBundle:         boolean;
    pumpFun:            boolean;
    stablecoinBalances: boolean;
    openOceanSwaps:     boolean;
    merkleProtection:   boolean;
    blinkLabsProtection:boolean;
    irisTransactions:   boolean;
    goldRushData:       boolean;
    titanSwaps:         boolean;
    riskAssessment:     boolean;
  };
}

// ─────────────────────────────────────────────────────────────
// Pump Fun API
// ─────────────────────────────────────────────────────────────

export interface PumpFunToken {
  mint:             string;
  name:             string;
  symbol:           string;
  description?:     string;
  image?:           string;
  creator:          string;
  createdTimestamp: number;
  marketCapSol:     number;
  usdMarketCap?:    number;
  price:            number;
  bondingCurve: {
    virtualTokenReserves: string;
    virtualSolReserves:   string;
    realTokenReserves:    string;
    realSolReserves:      string;
    tokenTotalSupply:     string;
    complete:             boolean;
  };
  raydiumPool?: string;
  graduated:    boolean;
  website?:     string;
  twitter?:     string;
  telegram?:    string;
}

export interface PumpFunTokenHolder {
  address:    string;
  balance:    string;
  percentage: number;
}

export interface PumpFunTrade {
  signature:   string;
  mint:        string;
  solAmount:   string;
  tokenAmount: string;
  isBuy:       boolean;
  user:        string;
  timestamp:   number;
  slot:        number;
}

export interface GetPumpFunTokensOptions {
  limit?:        number;
  offset?:       number;
  includeNsfw?:  boolean;
}

export interface GetPumpFunTokensByCreatorOptions {
  creator: string;
  limit?:  number;
  offset?: number;
}

export interface GetPumpFunTradesOptions {
  limit?:  number;
  offset?: number;
}

// ─────────────────────────────────────────────────────────────
// Multi-Chain Stablecoin Balance API
// ─────────────────────────────────────────────────────────────

export interface StablecoinBalance {
  chain:           string;
  contractAddress: string;
  name:            string;
  symbol:          string;
  decimals:        number;
  balance:         string;
  usdValue:        number;
  logo?:           string;
}

export interface GetStablecoinBalanceOptions {
  walletAddress: string;
  chains?:       string[];
}

export interface StablecoinBalanceResult {
  walletAddress: string;
  totalUsdValue: number;
  balances:      StablecoinBalance[];
}

// ─────────────────────────────────────────────────────────────
// OpenOcean V4 Swap API
// ─────────────────────────────────────────────────────────────

export interface OpenOceanToken {
  address:  string;
  name:     string;
  symbol:   string;
  decimals: number;
}

export interface OpenOceanQuoteOptions {
  inTokenAddress:  string;
  outTokenAddress: string;
  amount:          string;
  slippage?:       number;
}

export interface OpenOceanQuote {
  inToken:      OpenOceanToken;
  outToken:     OpenOceanToken;
  inAmount:     string;
  outAmount:    string;
  minOutAmount: string;
  priceImpact:  string;
  estimatedGas: string;
  path:         Array<{ name: string; part: number }>;
}

export interface OpenOceanSwapOptions extends OpenOceanQuoteOptions {
  userAddress: string;
}

export interface OpenOceanSwapResult {
  signature:      string;
  inAmount:       string;
  outAmount:      string;
  confirmationMs: number;
}

// ─────────────────────────────────────────────────────────────
// MEV Protection (Merkle + Blink Labs)
// ─────────────────────────────────────────────────────────────

export interface MevProtectedTxOptions {
  serializedTransaction: string;   // base64-encoded signed transaction
  tipLamports?:          number;
}

export interface MevTxResult {
  signature:      string;
  provider:       'merkle' | 'blinklabs';
  confirmationMs: number;
}

// ─────────────────────────────────────────────────────────────
// Iris Transaction Sender
// ─────────────────────────────────────────────────────────────

export interface IrisTxOptions {
  serializedTransaction: string;   // base64-encoded signed transaction
  skipPreflight?:        boolean;
  maxRetries?:           number;
}

export interface IrisTxResult {
  signature:      string;
  slot?:          number;
  confirmationMs: number;
}

// ─────────────────────────────────────────────────────────────
// GoldRush Multichain Data APIs
// ─────────────────────────────────────────────────────────────

export interface GoldRushTokenBalance {
  contractAddress: string;
  name:            string;
  symbol:          string;
  decimals:        number;
  logo?:           string;
  balance:         string;
  usdBalance?:     string;
  isSpam?:         boolean;
}

export interface GoldRushBalancesResult {
  chain:     string;
  address:   string;
  updatedAt: string;
  items:     GoldRushTokenBalance[];
}

export interface GoldRushTransaction {
  blockSignedAt: string;
  txHash:        string;
  successful:    boolean;
  fromAddress:   string;
  toAddress?:    string;
  value:         string;
  feesPaid:      string;
  gasSpent:      string;
  gasPrice:      string;
}

export interface GetGoldRushBalancesOptions {
  walletAddress:  string;
  chain?:         string;
  noSpam?:        boolean;
  quoteCurrency?: string;
}

export interface GetGoldRushTransactionsOptions {
  walletAddress: string;
  chain?:        string;
  pageSize?:     number;
  pageNumber?:   number;
}

// ─────────────────────────────────────────────────────────────
// Titan DeFi Swap Meta-Aggregation
// ─────────────────────────────────────────────────────────────

export interface TitanQuoteOptions {
  inputMint:    string;
  outputMint:   string;
  amount:       string;
  slippageBps?: number;
}

export interface TitanSwapRoute {
  dex:       string;
  percent:   number;
  inAmount:  string;
  outAmount: string;
}

export interface TitanSwapQuote {
  inputMint:      string;
  outputMint:     string;
  inAmount:       string;
  outAmount:      string;
  minOutAmount:   string;
  priceImpactPct: string;
  routes:         TitanSwapRoute[];
  timestamp:      number;
}

export interface TitanSwapOptions extends TitanQuoteOptions {
  userPublicKey:         string;
  serializedTransaction?: string;
}

export interface TitanSwapResult {
  signature:      string;
  inAmount:       string;
  outAmount:      string;
  confirmationMs: number;
}

// ─────────────────────────────────────────────────────────────
// Scorechain Risk Assessment API
// ─────────────────────────────────────────────────────────────

export interface AssessWalletRiskOptions {
  address:  string;
  network?: string;
}

export interface RiskFlag {
  category:    string;
  description: string;
  severity:    'low' | 'medium' | 'high' | 'critical';
}

export interface WalletRiskAssessment {
  address:    string;
  network:    string;
  riskScore:  number;
  riskLevel:  'low' | 'medium' | 'high' | 'severe';
  amlStatus:  'clean' | 'flagged' | 'blocked';
  flags:      RiskFlag[];
  reportUrl?: string;
  assessedAt: string;
}
