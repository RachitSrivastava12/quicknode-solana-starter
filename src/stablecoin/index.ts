import type {
  QNConfig,
  GetStablecoinBalanceOptions,
  StablecoinBalanceResult,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { rpcPost } from '../utils/http';

// Docs: QuickNode Multi-Chain Stablecoin Balance API
// Method: qn_getWalletStablecoinBalances
// Queries USDT, USDC, DAI, and more across Solana + 10 other chains
export async function getStablecoinBalance(
  config: QNConfig,
  options: GetStablecoinBalanceOptions
): Promise<StablecoinBalanceResult> {
  requireAddOn(config, 'stablecoinBalance');
  const params: Record<string, unknown> = { wallet: options.walletAddress };
  if (options.chains?.length) params.chains = options.chains;
  return rpcPost<StablecoinBalanceResult>(
    config.endpointUrl,
    'qn_getWalletStablecoinBalances',
    params,
    config.timeout
  );
}
