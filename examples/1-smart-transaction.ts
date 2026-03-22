/**
 * Example 1: Smart Transaction
 * Tests: estimatePriorityFees + sendSmartTransaction
 * Requires: QN_ENDPOINT_URL, WALLET_PRIVATE_KEY, ADDON_PRIORITY_FEES=true
 */
import 'dotenv/config';
import { Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { QNSolanaKit } from '../src';
import bs58 from 'bs58';

async function main() {
  if (!process.env.QN_ENDPOINT_URL)    { console.error('❌ Set QN_ENDPOINT_URL in .env');    process.exit(1); }
  if (!process.env.WALLET_PRIVATE_KEY) { console.error('❌ Set WALLET_PRIVATE_KEY in .env'); process.exit(1); }

  const kit = new QNSolanaKit({
    endpointUrl: process.env.QN_ENDPOINT_URL,
    addOns: { priorityFees: process.env.ADDON_PRIORITY_FEES === 'true' },
  });

  const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY));
  console.log(`\nWallet: ${signer.publicKey.toString()}`);

  // 1. Get live priority fees
  console.log('\n── Priority Fees ─────────────────────────────');
  const fees = await kit.estimatePriorityFees();
  console.log(`  low:         ${fees.low.toLocaleString()} µlamports/CU`);
  console.log(`  medium:      ${fees.medium.toLocaleString()} µlamports/CU`);
  console.log(`  recommended: ${fees.recommended.toLocaleString()} µlamports/CU`);
  console.log(`  high:        ${fees.high.toLocaleString()} µlamports/CU`);
  console.log(`  extreme:     ${fees.extreme.toLocaleString()} µlamports/CU`);
  console.log(`  congestion:  ${(fees.networkCongestion * 100).toFixed(1)}%`);

  // 2. Send smart transaction (0.001 SOL to self — safe test)
  console.log('\n── Sending Smart Transaction ─────────────────');
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey:   signer.publicKey,
      lamports:   Math.floor(0.001 * LAMPORTS_PER_SOL),
    })
  );

  const result = await kit.sendSmartTransaction({
    transaction,
    signer,
    options: { feeLevel: 'recommended', simulateFirst: true, maxRetries: 5 },
  });

  console.log('✓ Confirmed!');
  console.log(`  Signature:    ${result.signature}`);
  console.log(`  Slot:         ${result.slot}`);
  console.log(`  Priority fee: ${result.priorityFeeMicroLamports.toLocaleString()} µlamports/CU`);
  console.log(`  Compute:      ${result.computeUnitsUsed.toLocaleString()} CU`);
  console.log(`  Time:         ${result.confirmationMs}ms`);
  console.log(`  Explorer: https://explorer.solana.com/tx/${result.signature}`);
  console.log('\n✓ Example 1 done.\n');
}

main().catch(err => { console.error('❌', err.message ?? err); process.exit(1); });
