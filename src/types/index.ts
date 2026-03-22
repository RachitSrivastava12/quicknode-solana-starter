// ─────────────────────────────────────────────────────────────
// SDK Config
// ─────────────────────────────────────────────────────────────

export interface QNConfig {
  endpointUrl:  string;
  addOns?: {
    priorityFees?: boolean;
    liljit?:       boolean;
    das?:          boolean;
    metis?:        boolean;
    yellowstone?:  boolean;
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
    smartTransactions: boolean;
    nftQueries:        boolean;
    swaps:             boolean;
    yellowstoneStream: boolean;
    jitoBundle:        boolean;
  };
}
