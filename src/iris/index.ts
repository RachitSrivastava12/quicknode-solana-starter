import type { QNConfig, IrisTxOptions, IrisTxResult } from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { createConnection } from '../utils/helpers';
import { rpcPost } from '../utils/http';

// Docs: Astralane Iris Transaction Sender
// Lightning-fast Solana transaction sender with p90 sub-slot latency.
// Built for high-frequency traders, bots, and institutional-grade performance.
// The add-on exposes iris_sendTransaction on the QuickNode endpoint.

export async function sendIrisTransaction(
  config: QNConfig,
  options: IrisTxOptions
): Promise<IrisTxResult> {
  requireAddOn(config, 'iris');
  const startTime = Date.now();
  const conn      = createConnection(config);

  const result = await rpcPost<{ signature: string; slot?: number }>(
    config.endpointUrl,
    'iris_sendTransaction',
    {
      transaction:   options.serializedTransaction,
      skipPreflight: options.skipPreflight ?? false,
      maxRetries:    options.maxRetries    ?? 3,
    },
    config.timeout
  );

  // Confirm using standard web3.js after Iris submits
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  await conn.confirmTransaction(
    { signature: result.signature, blockhash, lastValidBlockHeight },
    config.commitment ?? 'confirmed'
  );

  return {
    signature:      result.signature,
    slot:           result.slot,
    confirmationMs: Date.now() - startTime,
  };
}
