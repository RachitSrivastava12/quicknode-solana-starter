/**
 * Example 3: Live Streaming
 * Tests: watchSlot, watchAccount, watchProgram
 * Requires: QN_ENDPOINT_URL (no add-ons needed — uses WebSocket)
 * Press Ctrl+C to stop
 */
import 'dotenv/config';
import { QNSolanaKit } from '../src';

async function main() {
  if (!process.env.QN_ENDPOINT_URL) { console.error('❌ Set QN_ENDPOINT_URL in .env'); process.exit(1); }

  const kit = new QNSolanaKit({
    endpointUrl: process.env.QN_ENDPOINT_URL,
    addOns: { yellowstone: false }, // WebSocket fallback — works on free tier
  });

  const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
  const WATCH   = process.env.WALLET_ADDRESS ?? 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk';

  console.log('\n@quicknode/solana-kit — Live Streaming');
  console.log('─'.repeat(50));
  console.log('Press Ctrl+C to stop.\n');

  // 1. Slot ticker
  let slotCount = 0;
  const slotHandle = kit.watchSlot((slot) => {
    slotCount++;
    process.stdout.write(`\r  [SLOT] ${slot.toLocaleString()}  (${slotCount} updates)   `);
  });

  // 2. Account watcher
  console.log(`Watching account: ${WATCH.slice(0, 8)}...`);
  const accountHandle = kit.watchAccount(WATCH, (update) => {
    console.log(`\n  [ACCOUNT] ${(update.lamports / 1e9).toFixed(6)} SOL | slot ${update.slot} | ${update.backend}`);
  });

  // 3. Jupiter program watcher
  console.log('Watching Jupiter swaps...\n');
  let swaps = 0;
  const jupHandle = kit.watchProgram(JUPITER, (tx) => {
    if (tx.err) return;
    swaps++;
    console.log(`\n  [SWAP #${swaps}] ${tx.signature.slice(0, 16)}...`);
    console.log(`  https://explorer.solana.com/tx/${tx.signature}`);
  });

  // Status check after 3s
  setTimeout(() => {
    console.log('\n\n── Stream Status ──────────────────────────────');
    console.log(`  Slot:    ${slotHandle.isConnected()   ? '🟢 connected' : '🔴 disconnected'}`);
    console.log(`  Account: ${accountHandle.isConnected() ? '🟢 connected' : '🔴 disconnected'}`);
    console.log(`  Jupiter: ${jupHandle.isConnected()    ? '🟢 connected' : '🔴 disconnected'}`);
  }, 3_000);

  const shutdown = () => {
    console.log('\n\nClosing streams...');
    slotHandle.unsubscribe();
    accountHandle.unsubscribe();
    jupHandle.unsubscribe();
    console.log('✓ Done.\n');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  await new Promise<void>(() => {});
}

main().catch(err => { console.error('❌', err.message ?? err); process.exit(1); });
