import type {
  QNConfig, DigitalAsset, AssetsResult, AssetProof, TokenAccount,
  GetAssetsByOwnerOptions, GetAssetsByCollectionOptions, SearchAssetsOptions,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { rpcPost } from '../utils/http';

// All methods use plain object params per QuickNode DAS docs

// Docs: https://www.quicknode.com/docs/solana/getAssetsByOwner
export async function getAssetsByOwner(config: QNConfig, options: GetAssetsByOwnerOptions): Promise<AssetsResult> {
  requireAddOn(config, 'das');
  return rpcPost<AssetsResult>(config.endpointUrl, 'getAssetsByOwner', {
    ownerAddress: options.ownerAddress,
    limit:        options.limit ?? 100,
    page:         options.page  ?? 1,
  }, config.timeout);
}

// Docs: https://www.quicknode.com/docs/solana/getAsset
export async function getAsset(config: QNConfig, mintAddress: string): Promise<DigitalAsset> {
  requireAddOn(config, 'das');
  return rpcPost<DigitalAsset>(config.endpointUrl, 'getAsset', { id: mintAddress }, config.timeout);
}

// Docs: https://www.quicknode.com/docs/solana/getAssetsByGroup
export async function getAssetsByCollection(config: QNConfig, options: GetAssetsByCollectionOptions): Promise<AssetsResult> {
  requireAddOn(config, 'das');
  return rpcPost<AssetsResult>(config.endpointUrl, 'getAssetsByGroup', {
    groupKey:   'collection',
    groupValue: options.collectionMint,
    limit:      options.limit ?? 100,
    page:       options.page  ?? 1,
  }, config.timeout);
}

// Docs: https://www.quicknode.com/docs/solana/searchAssets
export async function searchAssets(config: QNConfig, options: SearchAssetsOptions): Promise<AssetsResult> {
  requireAddOn(config, 'das');
  const params: Record<string, unknown> = {
    limit: options.limit ?? 100,
    page:  options.page  ?? 1,
  };
  if (options.ownerAddress)   params.ownerAddress   = options.ownerAddress;
  if (options.creatorAddress) params.creatorAddress = options.creatorAddress;
  if (options.collection)     params.grouping       = ['collection', options.collection];
  if (options.compressed !== undefined) params.compressed = options.compressed;
  if (options.tokenType)      params.tokenType      = options.tokenType;
  return rpcPost<AssetsResult>(config.endpointUrl, 'searchAssets', params, config.timeout);
}

// Docs: https://www.quicknode.com/docs/solana/getAssetProof
export async function getAssetProof(config: QNConfig, assetId: string): Promise<AssetProof> {
  requireAddOn(config, 'das');
  return rpcPost<AssetProof>(config.endpointUrl, 'getAssetProof', { id: assetId }, config.timeout);
}

export async function getTokenAccounts(config: QNConfig, walletAddress: string): Promise<TokenAccount[]> {
  const result = await rpcPost<{
    value: Array<{
      pubkey: string;
      account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number; uiAmount: number } } } } };
    }>;
  }>(config.endpointUrl, 'getTokenAccountsByOwner', [
    walletAddress,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { encoding: 'jsonParsed' },
  ], config.timeout);
  return (result.value ?? []).map(v => ({
    mint:         v.account.data.parsed.info.mint,
    tokenAccount: v.pubkey,
    balance:      Number(v.account.data.parsed.info.tokenAmount.amount),
    decimals:     v.account.data.parsed.info.tokenAmount.decimals,
    uiAmount:     v.account.data.parsed.info.tokenAmount.uiAmount ?? 0,
  }));
}
