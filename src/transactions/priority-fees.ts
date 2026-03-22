import type { QNConfig, PriorityFees, PriorityFeeOptions, FeeLevel } from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { rpcPost } from '../utils/http';

interface RawFeeResponse {
  per_compute_unit: {
    extreme: number; high: number; medium: number; low: number; recommended: number;
  };
  network_congestion?: number;
}

// Docs: https://www.quicknode.com/docs/solana/qn_estimatePriorityFees
// params is a plain object, NOT an array
export async function estimatePriorityFees(
  config: QNConfig,
  options: PriorityFeeOptions = {}
): Promise<PriorityFees> {
  requireAddOn(config, 'priorityFees');
  const params: Record<string, unknown> = {
    last_n_blocks: options.lastNBlocks ?? 100,
    api_version:   2,
  };
  if (options.account) params.account = options.account;

  const result = await rpcPost<RawFeeResponse>(
    config.endpointUrl,
    'qn_estimatePriorityFees',
    params,
    config.timeout
  );
  return {
    extreme:           result.per_compute_unit.extreme,
    high:              result.per_compute_unit.high,
    recommended:       result.per_compute_unit.recommended,
    medium:            result.per_compute_unit.medium,
    low:               result.per_compute_unit.low,
    networkCongestion: result.network_congestion ?? 0,
  };
}

export function feeForLevel(fees: PriorityFees, level: FeeLevel): number {
  return fees[level] ?? 1_000;
}
