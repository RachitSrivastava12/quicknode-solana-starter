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
export * from './pumpfun';
export * from './stablecoin';
export * from './openocean';
export * from './mev';
export * from './iris';
export * from './goldrush';
export * from './titan';
export * from './scorechain';
export { checkAddOns } from './addons';
export { TOKENS }     from './swap';
export { OO_TOKENS }  from './openocean';

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

  // ── Swap (Metis / Jupiter) ────────────────────────────────
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

  // ── Pump Fun ──────────────────────────────────────────────
  async getPumpFunTokens(
    options?: Parameters<typeof import('./pumpfun').getPumpFunTokens>[1]
  ) {
    const { getPumpFunTokens } = await import('./pumpfun');
    return getPumpFunTokens(this.config, options);
  }

  async getPumpFunToken(mint: string) {
    const { getPumpFunToken } = await import('./pumpfun');
    return getPumpFunToken(this.config, mint);
  }

  async getPumpFunTokensByCreator(
    options: Parameters<typeof import('./pumpfun').getPumpFunTokensByCreator>[1]
  ) {
    const { getPumpFunTokensByCreator } = await import('./pumpfun');
    return getPumpFunTokensByCreator(this.config, options);
  }

  async getPumpFunTokenHolders(mint: string) {
    const { getPumpFunTokenHolders } = await import('./pumpfun');
    return getPumpFunTokenHolders(this.config, mint);
  }

  async getPumpFunTokenTrades(
    mint: string,
    options?: Parameters<typeof import('./pumpfun').getPumpFunTokenTrades>[2]
  ) {
    const { getPumpFunTokenTrades } = await import('./pumpfun');
    return getPumpFunTokenTrades(this.config, mint, options);
  }

  // ── Stablecoin Balance ────────────────────────────────────
  async getStablecoinBalance(
    options: Parameters<typeof import('./stablecoin').getStablecoinBalance>[1]
  ) {
    const { getStablecoinBalance } = await import('./stablecoin');
    return getStablecoinBalance(this.config, options);
  }

  // ── OpenOcean V4 ──────────────────────────────────────────
  async getOpenOceanQuote(
    options: Parameters<typeof import('./openocean').getOpenOceanQuote>[1]
  ) {
    const { getOpenOceanQuote } = await import('./openocean');
    return getOpenOceanQuote(this.config, options);
  }

  async openOceanSwap(
    options: Parameters<typeof import('./openocean').openOceanSwap>[1]
  ) {
    const { openOceanSwap } = await import('./openocean');
    return openOceanSwap(this.config, options);
  }

  // ── MEV Protection ────────────────────────────────────────
  async sendMerkleProtectedTransaction(
    options: Parameters<typeof import('./mev').sendMerkleProtectedTransaction>[1]
  ) {
    const { sendMerkleProtectedTransaction } = await import('./mev');
    return sendMerkleProtectedTransaction(this.config, options);
  }

  async sendBlinkLabsTransaction(
    options: Parameters<typeof import('./mev').sendBlinkLabsTransaction>[1]
  ) {
    const { sendBlinkLabsTransaction } = await import('./mev');
    return sendBlinkLabsTransaction(this.config, options);
  }

  // ── Iris Transaction Sender ───────────────────────────────
  async sendIrisTransaction(
    options: Parameters<typeof import('./iris').sendIrisTransaction>[1]
  ) {
    const { sendIrisTransaction } = await import('./iris');
    return sendIrisTransaction(this.config, options);
  }

  // ── GoldRush Multichain ───────────────────────────────────
  async getGoldRushBalances(
    options: Parameters<typeof import('./goldrush').getGoldRushBalances>[1]
  ) {
    const { getGoldRushBalances } = await import('./goldrush');
    return getGoldRushBalances(this.config, options);
  }

  async getGoldRushTransactions(
    options: Parameters<typeof import('./goldrush').getGoldRushTransactions>[1]
  ) {
    const { getGoldRushTransactions } = await import('./goldrush');
    return getGoldRushTransactions(this.config, options);
  }

  // ── Titan DeFi Swap ───────────────────────────────────────
  async getTitanSwapQuote(
    options: Parameters<typeof import('./titan').getTitanSwapQuote>[1]
  ) {
    const { getTitanSwapQuote } = await import('./titan');
    return getTitanSwapQuote(this.config, options);
  }

  async titanSwap(
    options: Parameters<typeof import('./titan').titanSwap>[1]
  ) {
    const { titanSwap } = await import('./titan');
    return titanSwap(this.config, options);
  }

  subscribeTitanQuotes(
    options:  Parameters<typeof import('./titan').subscribeTitanQuotes>[1],
    onQuote:  Parameters<typeof import('./titan').subscribeTitanQuotes>[2],
    onError?: Parameters<typeof import('./titan').subscribeTitanQuotes>[3]
  ) {
    const { subscribeTitanQuotes } = require('./titan');
    return subscribeTitanQuotes(this.config, options, onQuote, onError);
  }

  // ── Scorechain Risk Assessment ────────────────────────────
  async assessWalletRisk(
    options: Parameters<typeof import('./scorechain').assessWalletRisk>[1]
  ) {
    const { assessWalletRisk } = await import('./scorechain');
    return assessWalletRisk(this.config, options);
  }

  async isWalletSafe(address: string) {
    const { isWalletSafe } = await import('./scorechain');
    return isWalletSafe(this.config, address);
  }
}

export default QNSolanaKit;
