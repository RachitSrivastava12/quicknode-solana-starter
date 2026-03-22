import {
  Connection, PublicKey,
  type Commitment,
  type AccountInfo,
  type Context,
} from '@solana/web3.js';
import type {
  QNConfig, WatchOptions, AccountUpdate, ProgramTx, WatchHandle,
} from '../types';
import { isAddOnEnabled } from '../utils/addon-guard';
import { createConnection } from '../utils/helpers';

export function watchAccount(
  config: QNConfig,
  address: string,
  onUpdate: (update: AccountUpdate) => void,
  options: WatchOptions = {}
): WatchHandle {
  const useYS = (options.backend === 'yellowstone' || !options.backend || options.backend === 'auto')
    && isAddOnEnabled(config, 'yellowstone');
  return useYS
    ? watchAccountYellowstone(config, address, onUpdate, options)
    : watchAccountWebSocket(config, address, onUpdate, options);
}

export function watchProgram(
  config: QNConfig,
  programId: string,
  onTx: (tx: ProgramTx) => void,
  options: WatchOptions = {}
): WatchHandle {
  const conn       = createConnection(config);
  const commitment = (options.commitment ?? config.commitment ?? 'confirmed') as Commitment;
  let active       = true;
  let subId: number | null = null;

  subId = conn.onLogs(
    new PublicKey(programId),
    (logs) => {
      if (!active) return;
      onTx({
        signature: logs.signature,
        slot:      0,
        blockTime: Math.floor(Date.now() / 1000),
        logs:      logs.logs,
        err:       logs.err as object | null,
      });
    },
    commitment
  );

  return {
    unsubscribe: () => {
      active = false;
      if (subId !== null) { conn.removeOnLogsListener(subId); subId = null; }
    },
    isConnected: () => active && subId !== null,
  };
}

export function watchSlot(config: QNConfig, onSlot: (slot: number) => void): WatchHandle {
  const conn = createConnection(config);
  let active = true;
  const id = conn.onSlotChange((info) => { if (active) onSlot(info.slot); });
  return {
    unsubscribe: () => { active = false; conn.removeSlotChangeListener(id); },
    isConnected: () => active,
  };
}

function watchAccountWebSocket(
  config: QNConfig,
  address: string,
  onUpdate: (u: AccountUpdate) => void,
  options: WatchOptions
): WatchHandle {
  const conn       = createConnection(config);
  const commitment = (options.commitment ?? config.commitment ?? 'confirmed') as Commitment;
  let active       = true;
  let subId: number | null = null;

  subId = conn.onAccountChange(
    new PublicKey(address),
    (info: AccountInfo<Buffer>, ctx: Context) => {
      if (!active) return;
      onUpdate({
        pubkey:     address,
        lamports:   info.lamports,
        owner:      info.owner.toString(),
        executable: info.executable,
        data:       info.data,
        slot:       ctx.slot,
        timestamp:  Date.now(),
        backend:    'websocket',
      });
    },
    commitment
  );

  return {
    unsubscribe: () => {
      active = false;
      if (subId !== null) { conn.removeAccountChangeListener(subId); subId = null; }
    },
    isConnected: () => active && subId !== null,
  };
}

function watchAccountYellowstone(
  config: QNConfig,
  address: string,
  onUpdate: (u: AccountUpdate) => void,
  options: WatchOptions
): WatchHandle {
  // Yellowstone gRPC requires @triton-one/yellowstone-grpc (paid add-on)
  // Fall back to WebSocket seamlessly — same API, just slightly higher latency
  console.warn('[QNSolanaKit] Yellowstone: falling back to WebSocket (install @triton-one/yellowstone-grpc for gRPC)');
  return watchAccountWebSocket(config, address, onUpdate, options);
}
