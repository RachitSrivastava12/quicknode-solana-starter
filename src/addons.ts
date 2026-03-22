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
      smartTransactions: get('priorityFees'),
      nftQueries:        get('das'),
      swaps:             get('metis'),
      yellowstoneStream: get('yellowstone'),
      jitoBundle:        get('liljit'),
    },
  };
}