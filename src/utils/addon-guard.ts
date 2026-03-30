import type { QNConfig } from '../types';
import { AddOnNotEnabledError } from '../types/errors';

type AddOnKey = keyof NonNullable<QNConfig['addOns']>;

interface AddOnMeta {
  tier:        'free' | 'paid';
  displayName: string;
  description: string;
}

const ADD_ON_META: Record<AddOnKey, AddOnMeta> = {
  // ── QuickNode native ──────────────────────────────────────
  priorityFees: {
    tier:        'free',
    displayName: 'Priority Fee API',
    description: 'Dynamic priority fee estimation for faster tx inclusion',
  },
  das: {
    tier:        'free',
    displayName: 'Metaplex DAS API',
    description: 'Query NFTs, cNFTs, and token metadata',
  },
  liljit: {
    tier:        'paid',
    displayName: "Lil' JIT (Jito Bundles)",
    description: 'MEV protection + atomic transaction execution via Jito',
  },
  metis: {
    tier:        'paid',
    displayName: 'Metis — Jupiter V6 Swap API',
    description: 'Best-price token swaps via Jupiter aggregator',
  },
  yellowstone: {
    tier:        'paid',
    displayName: 'Yellowstone gRPC',
    description: 'Ultra-low-latency real-time account and program streaming',
  },
  pumpfun: {
    tier:        'free',
    displayName: 'Pump Fun API',
    description: 'Access pump.fun token data, bonding curves, and trades',
  },
  stablecoinBalance: {
    tier:        'paid',
    displayName: 'Multi-Chain Stablecoin Balance API',
    description: 'Query stablecoin holdings across 10+ chains from one call',
  },
  // ── Third-party ───────────────────────────────────────────
  openocean: {
    tier:        'free',
    displayName: 'OpenOcean V4 Swap API',
    description: 'Best-rate DeFi swaps aggregated across 40+ chains',
  },
  merkle: {
    tier:        'free',
    displayName: 'Solana MEV Protection & Recovery',
    description: 'MEV-protected transaction submission via Merkle',
  },
  blinklabs: {
    tier:        'free',
    displayName: 'Solana MEV Resilience & Recovery',
    description: 'Improved transaction execution quality via Blink Labs',
  },
  iris: {
    tier:        'paid',
    displayName: 'Iris Transaction Sender',
    description: 'Lightning-fast Solana transaction sender with p90 sub-slot latency',
  },
  goldrush: {
    tier:        'paid',
    displayName: 'GoldRush — Multichain Data APIs',
    description: 'Onchain data from 100+ chains via Covalent',
  },
  titan: {
    tier:        'paid',
    displayName: 'DeFi Swap Meta-Aggregation API',
    description: 'WebSocket-based streaming executable swap quotes via Titan',
  },
  scorechain: {
    tier:        'paid',
    displayName: 'Risk Assessment API',
    description: 'AML/CFT risk scoring and compliance checks via Scorechain',
  },
};

/**
 * Checks whether a required add-on is enabled in the config.
 *
 * - If explicitly set to true → passes silently
 * - If explicitly set to false → throws AddOnNotEnabledError
 * - If not set (undefined) → logs a warning but does NOT throw
 *   (we give the benefit of the doubt if the dev hasn't configured addOns yet)
 */
export function requireAddOn(config: QNConfig, key: AddOnKey): void {
  const meta   = ADD_ON_META[key];
  const status = config.addOns?.[key];

  if (status === false) {
    throw new AddOnNotEnabledError(meta.displayName, meta.tier);
  }

  if (status === undefined) {
    // Warn but don't crash — let the RPC call proceed and fail naturally
    // with a helpful error if the add-on really isn't there
    console.warn(
      `[QNSolanaKit] ⚠  addOns.${key} is not set in your config.\n` +
      `  If you get errors, enable "${meta.displayName}" in your QuickNode dashboard\n` +
      `  and set addOns: { ${key}: true } in your QNSolanaKit config.\n` +
      `  Tier: ${meta.tier.toUpperCase()} — ${meta.description}`
    );
  }
  // status === true → all good, proceed
}

/**
 * Soft check — returns false instead of throwing.
 * Use this for features that degrade gracefully (e.g. fallback from
 * Yellowstone gRPC → WebSocket when yellowstone isn't enabled).
 */
export function isAddOnEnabled(config: QNConfig, key: AddOnKey): boolean {
  return config.addOns?.[key] === true;
}

export { ADD_ON_META };
