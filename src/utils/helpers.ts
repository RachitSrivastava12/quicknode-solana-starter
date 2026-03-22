import { Connection, PublicKey, type Commitment } from '@solana/web3.js';
import type { QNConfig } from '../types';
import { InvalidEndpointError } from '../types/errors';

export function createConnection(config: QNConfig): Connection {
  return new Connection(config.endpointUrl, {
    commitment:                      (config.commitment ?? 'confirmed') as Commitment,
    confirmTransactionInitialTimeout: config.timeout ?? 30_000,
  });
}

export function validateConfig(config: QNConfig): void {
  if (!config.endpointUrl) {
    throw new InvalidEndpointError('(empty)');
  }
  if (!config.endpointUrl.startsWith('http')) {
    throw new InvalidEndpointError(config.endpointUrl);
  }
}

export function toPublicKey(address: string | PublicKey): PublicKey {
  if (address instanceof PublicKey) return address;
  try {
    return new PublicKey(address);
  } catch {
    throw new Error(`Invalid Solana address: "${address}"`);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function backoffMs(attempt: number): number {
  // 300ms, 600ms, 1200ms, 2400ms, 4800ms — capped at 10s
  return Math.min(300 * Math.pow(2, attempt), 10_000);
}

export function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(6);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
