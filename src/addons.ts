import type { QNConfig, AddOnCheckResult, AddOnStatus } from './types';
import { rpcPost } from './utils/http';

function isEnabledError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return !(
    msg.includes('method not found') ||
    msg.includes('-32601') ||
    msg.includes('does not exist') ||
    msg.includes('not supported') ||
    msg.includes('403') ||
    msg.includes('unauthorized')
  );
}

interface AddOnDef {
  key:         keyof NonNullable<QNConfig['addOns']>;
  name:        string;
  tier:        'free' | 'paid';
  description: string;
  enableUrl:   string;
  probe:       (url: string) => Promise<boolean>;
}

const DEFS: AddOnDef[] = [
  {
    key:         'priorityFees',
    name:        'Priority Fee API',
    tier:        'free',
    description: 'Dynamic priority fee estimation for faster tx inclusion',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/solana-priority-fee',
    probe: async (url) => {
      try {
        const res  = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'qn_estimatePriorityFees', params: { last_n_blocks: 10, api_version: 2 } }),
          signal:  AbortSignal.timeout(8_000),
        });
        const data = await res.json() as { result?: unknown; error?: { code: number; message: string } };
        if (data.result !== undefined) return true;
        if (data.error) return isEnabledError(new Error(`${data.error.code}: ${data.error.message}`));
        return false;
      } catch { return false; }
    },
  },
  {
    key:         'das',
    name:        'Metaplex DAS API',
    tier:        'free',
    description: 'Query NFTs, compressed NFTs, token metadata',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/metaplex-das-api',
    probe: async (url) => {
      try {
        const res  = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAssetsByOwner', params: { ownerAddress: 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk', limit: 1, page: 1 } }),
          signal:  AbortSignal.timeout(8_000),
        });
        const data = await res.json() as { result?: unknown; error?: { code: number; message: string } };
        if (data.result !== undefined) return true;
        if (data.error) return isEnabledError(new Error(`${data.error.code}: ${data.error.message}`));
        return false;
      } catch { return false; }
    },
  },
  {
    key:         'metis',
    name:        'Metis — Jupiter V6 Swap API',
    tier:        'paid',
    description: 'Best-price token swaps via Jupiter aggregator',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/metis-jupiter-v6-swap-api',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(`${base}/jupiter/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50`, { signal: AbortSignal.timeout(5_000) });
        return res.status === 200;
      } catch { return false; }
    },
  },
  {
    key:         'liljit',
    name:        "Lil' JIT (Jito Bundles)",
    tier:        'paid',
    description: 'MEV protection + atomic transaction execution via Jito',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/lil-jit',
    probe: async (url) => {
      try {
        await rpcPost(url, 'sendBundle', [[]], 5_000);
        return true;
      } catch (err) { return isEnabledError(err); }
    },
  },
  {
    key:         'yellowstone',
    name:        'Yellowstone gRPC',
    tier:        'paid',
    description: 'Ultra-low-latency gRPC account + program streaming',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/yellowstone-grpc',
    probe: async () => false,
  },
  {
    key:         'pumpfun',
    name:        'Pump Fun API',
    tier:        'free',
    description: 'Access pump.fun token data, bonding curves, and trades',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/pump-fun-api',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(`${base}/pump-fun/coins?limit=1`, { signal: AbortSignal.timeout(5_000) });
        return res.status === 200;
      } catch { return false; }
    },
  },
  {
    key:         'stablecoinBalance',
    name:        'Multi-Chain Stablecoin Balance API',
    tier:        'paid',
    description: 'Query stablecoin holdings across 10+ chains from one call',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/multi-chain-stablecoin-balance-api',
    probe: async (url) => {
      try {
        const res  = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'qn_getWalletStablecoinBalances', params: { wallet: 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk' } }),
          signal:  AbortSignal.timeout(8_000),
        });
        const data = await res.json() as { result?: unknown; error?: { code: number; message: string } };
        if (data.result !== undefined) return true;
        if (data.error) return isEnabledError(new Error(`${data.error.code}: ${data.error.message}`));
        return false;
      } catch { return false; }
    },
  },
  {
    key:         'openocean',
    name:        'OpenOcean V4 Swap API',
    tier:        'free',
    description: 'Best-rate DeFi swaps aggregated across 40+ chains',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/openocean-v4-swap-api',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(
          `${base}/openocean/v4/solana/quote?inTokenAddress=So11111111111111111111111111111111111111112&outTokenAddress=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000`,
          { signal: AbortSignal.timeout(5_000) }
        );
        return res.status === 200;
      } catch { return false; }
    },
  },
  {
    key:         'merkle',
    name:        'Solana MEV Protection & Recovery',
    tier:        'free',
    description: 'MEV-protected transaction submission via Merkle',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/solana-mev-protection-and-recovery',
    probe: async (url) => {
      try {
        const res  = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'mev_sendBundle', params: [[]] }),
          signal:  AbortSignal.timeout(5_000),
        });
        const data = await res.json() as { result?: unknown; error?: { code: number; message: string } };
        if (data.result !== undefined) return true;
        if (data.error) return isEnabledError(new Error(`${data.error.code}: ${data.error.message}`));
        return false;
      } catch { return false; }
    },
  },
  {
    key:         'blinklabs',
    name:        'Solana MEV Resilience & Recovery',
    tier:        'free',
    description: 'Improved transaction execution quality via Blink Labs',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/solana-mev-resilience-and-recovery',
    probe: async (url) => {
      try {
        const res  = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'blinklabs_getStatus', params: [] }),
          signal:  AbortSignal.timeout(5_000),
        });
        const data = await res.json() as { result?: unknown; error?: { code: number; message: string } };
        if (data.result !== undefined) return true;
        if (data.error) return isEnabledError(new Error(`${data.error.code}: ${data.error.message}`));
        return false;
      } catch { return false; }
    },
  },
  {
    key:         'iris',
    name:        'Iris Transaction Sender',
    tier:        'paid',
    description: 'Lightning-fast Solana transaction sender with p90 sub-slot latency',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/iris-transaction-sender',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(`${base}/iris/v1/health`, { signal: AbortSignal.timeout(5_000) });
        return res.status === 200;
      } catch { return false; }
    },
  },
  {
    key:         'goldrush',
    name:        'GoldRush — Multichain Data APIs',
    tier:        'paid',
    description: 'Onchain data from 100+ chains via Covalent',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/goldrush-multichain-data-apis',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(
          `${base}/goldrush/v1/solana-mainnet/address/E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk/balances_v2/`,
          { signal: AbortSignal.timeout(5_000) }
        );
        return res.status === 200;
      } catch { return false; }
    },
  },
  {
    key:         'titan',
    name:        'DeFi Swap Meta-Aggregation API',
    tier:        'paid',
    description: 'WebSocket-based streaming executable swap quotes via Titan',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/defi-swap-meta-aggregation-api',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(
          `${base}/titan/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000`,
          { signal: AbortSignal.timeout(5_000) }
        );
        return res.status === 200;
      } catch { return false; }
    },
  },
  {
    key:         'scorechain',
    name:        'Risk Assessment API',
    tier:        'paid',
    description: 'AML/CFT risk scoring and compliance checks via Scorechain',
    enableUrl:   'https://marketplace.quicknode.com/add-ons/risk-assessment-api',
    probe: async (url) => {
      try {
        const base = url.replace(/\/$/, '');
        const res  = await fetch(`${base}/scorechain/v1/health`, { signal: AbortSignal.timeout(5_000) });
        // 200 = enabled, 401 = enabled but needs auth, anything else = not enabled
        return res.status === 200 || res.status === 401;
      } catch { return false; }
    },
  },
];

export async function checkAddOns(
  config: Pick<QNConfig, 'endpointUrl' | 'timeout'>
): Promise<AddOnCheckResult> {
  const statuses: AddOnStatus[] = [];
  for (const def of DEFS) {
    const enabled = await def.probe(config.endpointUrl);
    statuses.push({ name: def.name, enabled, tier: def.tier, description: def.description, enableUrl: def.enableUrl });
  }
  const get = (key: keyof NonNullable<QNConfig['addOns']>): boolean =>
    statuses.find(s => DEFS.find(d => d.key === key)?.name === s.name)?.enabled ?? false;
  return {
    endpoint: config.endpointUrl,
    addOns:   statuses,
    canUse: {
      smartTransactions:   get('priorityFees'),
      nftQueries:          get('das'),
      swaps:               get('metis'),
      yellowstoneStream:   get('yellowstone'),
      jitoBundle:          get('liljit'),
      pumpFun:             get('pumpfun'),
      stablecoinBalances:  get('stablecoinBalance'),
      openOceanSwaps:      get('openocean'),
      merkleProtection:    get('merkle'),
      blinkLabsProtection: get('blinklabs'),
      irisTransactions:    get('iris'),
      goldRushData:        get('goldrush'),
      titanSwaps:          get('titan'),
      riskAssessment:      get('scorechain'),
    },
  };
}