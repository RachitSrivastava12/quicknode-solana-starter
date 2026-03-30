import type {
  QNConfig,
  GoldRushBalancesResult,
  GoldRushTransaction,
  GetGoldRushBalancesOptions,
  GetGoldRushTransactionsOptions,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { httpGet } from '../utils/http';

// GoldRush (Covalent) REST API mounted at /goldrush/v1/ on the QuickNode endpoint
// Docs: https://goldrush.dev/docs/api/
// Supports 100+ chains. Default chain for this Solana kit is 'solana-mainnet'.

function base(config: QNConfig): string {
  return config.endpointUrl.replace(/\/$/, '') + '/goldrush/v1';
}

// Get all token + NFT balances for a wallet on any supported chain
export async function getGoldRushBalances(
  config: QNConfig,
  options: GetGoldRushBalancesOptions
): Promise<GoldRushBalancesResult> {
  requireAddOn(config, 'goldrush');
  const chain = options.chain ?? 'solana-mainnet';
  const qs    = new URLSearchParams();
  if (options.noSpam        !== undefined) qs.set('no-spam',        String(options.noSpam));
  if (options.quoteCurrency)               qs.set('quote-currency', options.quoteCurrency);

  const query = qs.toString() ? `?${qs}` : '';
  return httpGet<GoldRushBalancesResult>(
    `${base(config)}/${chain}/address/${options.walletAddress}/balances_v2/${query}`,
    config.timeout
  );
}

// Get transaction history for a wallet
export async function getGoldRushTransactions(
  config: QNConfig,
  options: GetGoldRushTransactionsOptions
): Promise<{ items: GoldRushTransaction[]; currentPage: number; links: { next?: string } }> {
  requireAddOn(config, 'goldrush');
  const chain = options.chain ?? 'solana-mainnet';
  const qs    = new URLSearchParams();
  if (options.pageSize)   qs.set('page-size',   String(options.pageSize));
  if (options.pageNumber) qs.set('page-number',  String(options.pageNumber));

  const query = qs.toString() ? `?${qs}` : '';
  return httpGet(
    `${base(config)}/${chain}/address/${options.walletAddress}/transactions_v3/${query}`,
    config.timeout
  );
}
