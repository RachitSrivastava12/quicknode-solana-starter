import {
  ComputeBudgetProgram,
  Connection,
  Transaction,
  type Keypair,
  type PublicKey,
  type TransactionInstruction,
} from '@solana/web3.js';
import type { QNConfig, SendSmartTxOptions, SmartTxResult } from '../types';
import { TransactionFailedError, MaxRetriesExceededError } from '../types/errors';
import { createConnection, sleep, backoffMs } from '../utils/helpers';
import { estimatePriorityFees, feeForLevel } from './priority-fees';

const DEFAULTS: Required<SendSmartTxOptions> = {
  feeLevel:          'recommended',
  useJito:           false,
  maxRetries:        5,
  simulateFirst:     true,
  computeUnitBuffer: 10,
  skipPreflight:     false,
};

export async function sendSmartTransaction(
  config: QNConfig,
  params: { transaction: Transaction; signer: Keypair; options?: SendSmartTxOptions }
): Promise<SmartTxResult> {
  const opts      = { ...DEFAULTS, ...params.options };
  const conn      = createConnection(config);
  const startTime = Date.now();

  let computeUnits = 200_000;
  if (opts.simulateFirst) {
    computeUnits = await simulateCU(conn, params.transaction, params.signer, opts.computeUnitBuffer);
  }

  let priorityFee = 1_000;
  try {
    const fees = await estimatePriorityFees(config);
    priorityFee = feeForLevel(fees, opts.feeLevel);
  } catch {
    console.warn('[QNSolanaKit] Priority fee estimation failed — using fallback 1000 µlamports/CU');
  }

  const tx = buildTxWithBudget(params.transaction, computeUnits, priorityFee);

  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer        = params.signer.publicKey;
      tx.sign(params.signer);

      const signature = await conn.sendRawTransaction(tx.serialize(), {
        skipPreflight: opts.skipPreflight,
        maxRetries:    0,
      });

      const confirmation = await conn.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        config.commitment ?? 'confirmed'
      );

      if (confirmation.value.err) {
        throw new TransactionFailedError(signature, confirmation.value.err);
      }

      const txInfo = await conn.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      return {
        signature,
        slot:                     txInfo?.slot ?? 0,
        priorityFeeMicroLamports: priorityFee,
        computeUnitsUsed:         computeUnits,
        jitoBundle:               false,
        confirmationMs:           Date.now() - startTime,
      };
    } catch (err) {
      lastError = err;
      if (err instanceof TransactionFailedError) throw err;
      if (attempt < opts.maxRetries) {
        console.warn(`[QNSolanaKit] Attempt ${attempt + 1} failed, retrying...`);
        await sleep(backoffMs(attempt));
      }
    }
  }
  throw new MaxRetriesExceededError(opts.maxRetries, lastError);
}

export async function prepareSmartTransaction(
  config: QNConfig,
  params: {
    transaction: Transaction;
    payer:       PublicKey;
    options?:    Pick<SendSmartTxOptions, 'feeLevel' | 'computeUnitBuffer'>;
  }
): Promise<{ transaction: Transaction; priorityFeeMicroLamports: number; computeUnits: number }> {
  const opts = { ...DEFAULTS, ...params.options };
  const conn = createConnection(config);

  let priorityFee  = 1_000;
  let computeUnits = 200_000;

  try {
    const fees = await estimatePriorityFees(config);
    priorityFee = feeForLevel(fees, opts.feeLevel);
  } catch { /* use fallback */ }

  const tx = buildTxWithBudget(params.transaction, computeUnits, priorityFee);
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer        = params.payer;

  return { transaction: tx, priorityFeeMicroLamports: priorityFee, computeUnits };
}

async function simulateCU(
  conn: Connection,
  tx: Transaction,
  signer: Keypair,
  bufferPct: number
): Promise<number> {
  try {
    const simTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ...tx.instructions
    );
    const { blockhash } = await conn.getLatestBlockhash('confirmed');
    simTx.recentBlockhash = blockhash;
    simTx.feePayer        = signer.publicKey;
    const sim = await conn.simulateTransaction(simTx, [signer], true);
    if (sim.value.err) return 200_000;
    const estimated = sim.value.unitsConsumed ?? 200_000;
    return Math.ceil(estimated * (1 + bufferPct / 100));
  } catch { return 200_000; }
}

function buildTxWithBudget(tx: Transaction, cu: number, fee: number): Transaction {
  const ixs = tx.instructions.filter(
    (ix: TransactionInstruction) => !ix.programId.equals(ComputeBudgetProgram.programId)
  );
  const newTx = new Transaction();
  newTx.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: cu }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fee }),
    ...ixs
  );
  return newTx;
}
