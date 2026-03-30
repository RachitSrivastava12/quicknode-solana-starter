import type {
  QNConfig,
  PumpFunToken,
  PumpFunTokenHolder,
  PumpFunTrade,
  GetPumpFunTokensOptions,
  GetPumpFunTokensByCreatorOptions,
  GetPumpFunTradesOptions,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { httpGet } from '../utils/http';

function base(config: QNConfig): string {
  return config.endpointUrl.replace(/\/$/, '') + '/pump-fun';
}

// Docs: QuickNode Pump Fun API — get latest tokens by launch time
export async function getPumpFunTokens(
  config: QNConfig,
  options: GetPumpFunTokensOptions = {}
): Promise<PumpFunToken[]> {
  requireAddOn(config, 'pumpfun');
  const qs = new URLSearchParams({
    limit:  String(options.limit  ?? 20),
    offset: String(options.offset ?? 0),
  });
  if (options.includeNsfw !== undefined) qs.set('include_nsfw', String(options.includeNsfw));
  return httpGet<PumpFunToken[]>(`${base(config)}/coins?${qs}`, config.timeout);
}

// Get a single token by its mint address
export async function getPumpFunToken(
  config: QNConfig,
  mint: string
): Promise<PumpFunToken> {
  requireAddOn(config, 'pumpfun');
  return httpGet<PumpFunToken>(`${base(config)}/coins/${mint}`, config.timeout);
}

// Get all tokens created by a specific wallet
export async function getPumpFunTokensByCreator(
  config: QNConfig,
  options: GetPumpFunTokensByCreatorOptions
): Promise<PumpFunToken[]> {
  requireAddOn(config, 'pumpfun');
  const qs = new URLSearchParams({
    creator: options.creator,
    limit:   String(options.limit  ?? 20),
    offset:  String(options.offset ?? 0),
  });
  return httpGet<PumpFunToken[]>(`${base(config)}/coins?${qs}`, config.timeout);
}

// Get token holder distribution
export async function getPumpFunTokenHolders(
  config: QNConfig,
  mint: string
): Promise<PumpFunTokenHolder[]> {
  requireAddOn(config, 'pumpfun');
  return httpGet<PumpFunTokenHolder[]>(`${base(config)}/coins/${mint}/holders`, config.timeout);
}

// Get recent trades for a token
export async function getPumpFunTokenTrades(
  config: QNConfig,
  mint: string,
  options: GetPumpFunTradesOptions = {}
): Promise<PumpFunTrade[]> {
  requireAddOn(config, 'pumpfun');
  const qs = new URLSearchParams({
    mint,
    limit:  String(options.limit  ?? 20),
    offset: String(options.offset ?? 0),
  });
  return httpGet<PumpFunTrade[]>(`${base(config)}/trades/all?${qs}`, config.timeout);
}
