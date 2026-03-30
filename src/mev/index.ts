import type { QNConfig, MevProtectedTxOptions, MevTxResult } from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { createConnection } from '../utils/helpers';
import { rpcPost } from '../utils/http';

// ── Merkle MEV Protection & Recovery ──────────────────────────────────────────
// Docs: https://docs.merkle.io
// Sends transactions through Merkle's validators for MEV protection.
// The add-on exposes the mev_sendTransaction RPC method on the QuickNode endpoint.

export async function sendMerkleProtectedTransaction(
  config: QNConfig,
  options: MevProtectedTxOptions
): Promise<MevTxResult> {
  requireAddOn(config, 'merkle');
  const startTime = Date.now();
  const conn      = createConnection(config);

  const params: Record<string, unknown> = {
    transaction: options.serializedTransaction,
  };
  if (options.tipLamports) params.tip = options.tipLamports;

  const signature = await rpcPost<string>(
    config.endpointUrl,
    'mev_sendTransaction',
    params,
    config.timeout
  );

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    config.commitment ?? 'confirmed'
  );

  return {
    signature,
    provider:       'merkle',
    confirmationMs: Date.now() - startTime,
  };
}

// ── Blink Labs MEV Resilience & Recovery ──────────────────────────────────────
// Docs: https://blinklabs.io
// Routes transactions through Blink Labs' optimized transaction pipeline for
// improved inclusion rates and MEV resilience.

export async function sendBlinkLabsTransaction(
  config: QNConfig,
  options: MevProtectedTxOptions
): Promise<MevTxResult> {
  requireAddOn(config, 'blinklabs');
  const startTime = Date.now();
  const conn      = createConnection(config);

  const params: Record<string, unknown> = {
    transaction: options.serializedTransaction,
  };
  if (options.tipLamports) params.tip = options.tipLamports;

  const signature = await rpcPost<string>(
    config.endpointUrl,
    'blinklabs_sendTransaction',
    params,
    config.timeout
  );

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    config.commitment ?? 'confirmed'
  );

  return {
    signature,
    provider:       'blinklabs',
    confirmationMs: Date.now() - startTime,
  };
}
