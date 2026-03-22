import { VersionedTransaction, type Keypair } from '@solana/web3.js';
import type { QNConfig, SwapOptions, SwapQuoteOptions, SwapQuote, SwapResult } from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { createConnection } from '../utils/helpers';
import { httpGet, httpPost } from '../utils/http';

export const TOKENS = {
  SOL:  'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP:  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY:  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  WIF:  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
} as const;

// Docs: Metis add-on exposes Jupiter V6 REST API at /jupiter/v6/
export async function getSwapQuote(config: QNConfig, options: SwapQuoteOptions): Promise<SwapQuote> {
  requireAddOn(config, 'metis');
  const base = config.endpointUrl.replace(/\/$/, '');
  const qs = `inputMint=${options.inputMint}&outputMint=${options.outputMint}` +
             `&amount=${options.amount.toString()}&slippageBps=${options.slippageBps ?? 50}`;
  return httpGet<SwapQuote>(`${base}/jupiter/v6/quote?${qs}`, config.timeout);
}

export async function swap(
  config: QNConfig,
  options: SwapOptions & { signer: Keypair }
): Promise<SwapResult> {
  requireAddOn(config, 'metis');
  const startTime = Date.now();
  const conn      = createConnection(config);
  const base      = config.endpointUrl.replace(/\/$/, '');

  const quote = await getSwapQuote(config, options);

  const swapRes = await httpPost<{ swapTransaction: string }>(
    `${base}/jupiter/v6/swap`,
    {
      quoteResponse:            quote,
      userPublicKey:            options.userPublicKey,
      wrapAndUnwrapSol:         true,
      dynamicComputeUnitLimit:  true,
      prioritizationFeeLamports: 'auto',
    },
    config.timeout
  );

  const txBuf = Buffer.from(swapRes.swapTransaction, 'base64');
  const tx    = VersionedTransaction.deserialize(txBuf);
  tx.sign([options.signer]);

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
    inputAmount:    BigInt(quote.inAmount),
    outputAmount:   BigInt(quote.outAmount),
    priceImpactPct: parseFloat(quote.priceImpactPct),
    confirmationMs: Date.now() - startTime,
  };
}
