/**
 * @quicknode/solana-kit
 * Unified SDK for all QuickNode Solana add-ons.
 */
import { Connection } from '@solana/web3.js';
import type { QNConfig, AddOnCheckResult } from './types';
import { createConnection, validateConfig } from './utils/helpers';

// Re-export everything
export * from './types';
export * from './types/errors';
export * from './transactions';
export * from './assets';
export * from './streaming';
export * from './swap';
export { checkAddOns } from './addons';
export { TOKENS } from './swap';

export class QNSolanaKit {
  public readonly config:     QNConfig;
  public readonly connection: Connection;

  constructor(config: QNConfig) {
    validateConfig(config);
    this.config     = config;
    this.connection = createConnection(config);
  }

  // ── Diagnostics ───────────────────────────────────────────
  async checkAddOns(): Promise<AddOnCheckResult> {
    const { checkAddOns } = await import('./addons');
    return checkAddOns(this.config);
  }

  // ── Transactions ──────────────────────────────────────────
  async sendSmartTransaction(
    params: Parameters<typeof import('./transactions').sendSmartTransaction>[1]
  ) {
    const { sendSmartTransaction } = await import('./transactions');
    return sendSmartTransaction(this.config, params);
  }

  async prepareSmartTransaction(
    params: Parameters<typeof import('./transactions').prepareSmartTransaction>[1]
  ) {
    const { prepareSmartTransaction } = await import('./transactions');
    return prepareSmartTransaction(this.config, params);
  }

  async estimatePriorityFees(
    options?: Parameters<typeof import('./transactions').estimatePriorityFees>[1]
  ) {
    const { estimatePriorityFees } = await import('./transactions');
    return estimatePriorityFees(this.config, options);
  }

  // ── Assets ────────────────────────────────────────────────
  async getAssetsByOwner(
    options: Parameters<typeof import('./assets').getAssetsByOwner>[1]
  ) {
    const { getAssetsByOwner } = await import('./assets');
    return getAssetsByOwner(this.config, options);
  }

  async getAsset(mintAddress: string) {
    const { getAsset } = await import('./assets');
    return getAsset(this.config, mintAddress);
  }

  async getAssetsByCollection(
    options: Parameters<typeof import('./assets').getAssetsByCollection>[1]
  ) {
    const { getAssetsByCollection } = await import('./assets');
    return getAssetsByCollection(this.config, options);
  }

  async searchAssets(
    options: Parameters<typeof import('./assets').searchAssets>[1]
  ) {
    const { searchAssets } = await import('./assets');
    return searchAssets(this.config, options);
  }

  async getAssetProof(assetId: string) {
    const { getAssetProof } = await import('./assets');
    return getAssetProof(this.config, assetId);
  }

  async getTokenAccounts(walletAddress: string) {
    const { getTokenAccounts } = await import('./assets');
    return getTokenAccounts(this.config, walletAddress);
  }

  // ── Streaming ─────────────────────────────────────────────
  watchAccount(
    address:  string,
    onUpdate: Parameters<typeof import('./streaming').watchAccount>[2],
    options?: Parameters<typeof import('./streaming').watchAccount>[3]
  ) {
    const { watchAccount } = require('./streaming');
    return watchAccount(this.config, address, onUpdate, options);
  }

  watchProgram(
    programId: string,
    onTx:      Parameters<typeof import('./streaming').watchProgram>[2],
    options?:  Parameters<typeof import('./streaming').watchProgram>[3]
  ) {
    const { watchProgram } = require('./streaming');
    return watchProgram(this.config, programId, onTx, options);
  }

  watchSlot(onSlot: (slot: number) => void) {
    const { watchSlot } = require('./streaming');
    return watchSlot(this.config, onSlot);
  }

  // ── Swap ──────────────────────────────────────────────────
  async getSwapQuote(
    options: Parameters<typeof import('./swap').getSwapQuote>[1]
  ) {
    const { getSwapQuote } = await import('./swap');
    return getSwapQuote(this.config, options);
  }

  async swap(
    options: Parameters<typeof import('./swap').swap>[1]
  ) {
    const { swap } = await import('./swap');
    return swap(this.config, options);
  }
}

export default QNSolanaKit;
