import { VersionedTransaction, type Keypair } from '@solana/web3.js';
import type {
  QNConfig,
  OpenOceanQuote,
  OpenOceanQuoteOptions,
  OpenOceanSwapOptions,
  OpenOceanSwapResult,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { createConnection } from '../utils/helpers';
import { httpGet, httpPost } from '../utils/http';

// OpenOcean V4 REST API is mounted at /openocean/v4/solana/ on the QuickNode endpoint
// Docs: https://docs.openocean.finance/dev/openocean-api-3.0

function base(config: QNConfig): string {
  return config.endpointUrl.replace(/\/$/, '') + '/openocean/v4/solana';
}

// Get a price quote without executing
export async function getOpenOceanQuote(
  config: QNConfig,
  options: OpenOceanQuoteOptions
): Promise<OpenOceanQuote> {
  requireAddOn(config, 'openocean');
  const qs = new URLSearchParams({
    inTokenAddress:  options.inTokenAddress,
    outTokenAddress: options.outTokenAddress,
    amount:          options.amount,
    slippage:        String(options.slippage ?? 1),
  });
  const res = await httpGet<{ data: OpenOceanQuote }>(`${base(config)}/quote?${qs}`, config.timeout);
  return res.data;
}

// Execute a swap via OpenOcean
export async function openOceanSwap(
  config: QNConfig,
  options: OpenOceanSwapOptions & { signer: Keypair }
): Promise<OpenOceanSwapResult> {
  requireAddOn(config, 'openocean');
  const startTime = Date.now();
  const conn      = createConnection(config);

  const qs = new URLSearchParams({
    inTokenAddress:  options.inTokenAddress,
    outTokenAddress: options.outTokenAddress,
    amount:          options.amount,
    slippage:        String(options.slippage ?? 1),
    account:         options.userAddress,
  });

  const res = await httpGet<{ data: { data: string } }>(
    `${base(config)}/swap_quote?${qs}`,
    config.timeout
  );

  const txBuf     = Buffer.from(res.data.data, 'base64');
  const tx        = VersionedTransaction.deserialize(txBuf);
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
    inAmount:       options.amount,
    outAmount:      '0',   // populated from quote — caller can use getOpenOceanQuote first
    confirmationMs: Date.now() - startTime,
  };
}

// SOL and popular token addresses for OpenOcean on Solana
export const OO_TOKENS = {
  SOL:  'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
} as const;
