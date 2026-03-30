import type {
  QNConfig,
  TitanQuoteOptions,
  TitanSwapQuote,
  TitanSwapOptions,
  TitanSwapResult,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { createConnection } from '../utils/helpers';
import { httpGet, httpPost } from '../utils/http';

// Titan DeFi Swap Meta-Aggregation API (by Titan)
// Docs: https://docs.titanswap.io
// REST endpoint for point-in-time quotes; WebSocket available for streaming.
// Mounted at /titan/v1/ on the QuickNode endpoint.

function base(config: QNConfig): string {
  return config.endpointUrl.replace(/\/$/, '') + '/titan/v1';
}

// Get a single best-price quote aggregated across all DEXes
export async function getTitanSwapQuote(
  config: QNConfig,
  options: TitanQuoteOptions
): Promise<TitanSwapQuote> {
  requireAddOn(config, 'titan');
  const qs = new URLSearchParams({
    inputMint:    options.inputMint,
    outputMint:   options.outputMint,
    amount:       options.amount,
    slippageBps:  String(options.slippageBps ?? 50),
  });
  return httpGet<TitanSwapQuote>(`${base(config)}/quote?${qs}`, config.timeout);
}

// Execute a swap via Titan's meta-aggregation
export async function titanSwap(
  config: QNConfig,
  options: TitanSwapOptions
): Promise<TitanSwapResult> {
  requireAddOn(config, 'titan');
  const startTime = Date.now();
  const conn      = createConnection(config);

  // Get quote first
  const quote = await getTitanSwapQuote(config, options);

  // Build and execute swap transaction
  const swapRes = await httpPost<{ transaction: string }>(
    `${base(config)}/swap`,
    {
      quote,
      userPublicKey: options.userPublicKey,
      ...(options.serializedTransaction && { transaction: options.serializedTransaction }),
    },
    config.timeout
  );

  const { VersionedTransaction } = await import('@solana/web3.js');
  const txBuf     = Buffer.from(swapRes.transaction, 'base64');
  const tx        = VersionedTransaction.deserialize(txBuf);

  const signature = await conn.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries:    3,
  });

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
  await conn.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    config.commitment ?? 'confirmed'
  );

  return {
    signature,
    inAmount:       quote.inAmount,
    outAmount:      quote.outAmount,
    confirmationMs: Date.now() - startTime,
  };
}

// Subscribe to streaming quotes via WebSocket (returns unsubscribe fn)
export function subscribeTitanQuotes(
  config: QNConfig,
  options: TitanQuoteOptions,
  onQuote: (quote: TitanSwapQuote) => void,
  onError?: (err: Error) => void
): () => void {
  requireAddOn(config, 'titan');
  const wsUrl = config.endpointUrl
    .replace(/\/$/, '')
    .replace(/^http/, 'ws') + '/titan/v1/stream';

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type:        'subscribe',
      inputMint:   options.inputMint,
      outputMint:  options.outputMint,
      amount:      options.amount,
      slippageBps: options.slippageBps ?? 50,
    }));
  };

  ws.onmessage = (event) => {
    try {
      const quote = JSON.parse(event.data as string) as TitanSwapQuote;
      onQuote(quote);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  ws.onerror = (event) => {
    onError?.(new Error(`Titan WebSocket error: ${JSON.stringify(event)}`));
  };

  return () => ws.close();
}
