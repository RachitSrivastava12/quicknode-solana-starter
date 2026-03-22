/**
 * Example 2: NFT & Digital Asset Queries
 * Tests: getAssetsByOwner, getTokenAccounts
 * Requires: QN_ENDPOINT_URL, WALLET_ADDRESS, ADDON_DAS=true
 */
import 'dotenv/config';
import { QNSolanaKit } from '../src';

async function main() {
  if (!process.env.QN_ENDPOINT_URL) { console.error('❌ Set QN_ENDPOINT_URL in .env'); process.exit(1); }
  if (!process.env.WALLET_ADDRESS)  { console.error('❌ Set WALLET_ADDRESS in .env');  process.exit(1); }

  const kit = new QNSolanaKit({
    endpointUrl: process.env.QN_ENDPOINT_URL,
    addOns: { das: process.env.ADDON_DAS === 'true' },
  });

  const wallet = process.env.WALLET_ADDRESS;
  console.log(`\nQuerying wallet: ${wallet}\n`);

  // 1. Get NFTs
  console.log('── NFTs by Owner ──────────────────────────────');
  const { items, total } = await kit.getAssetsByOwner({ ownerAddress: wallet, limit: 10 });
  console.log(`  Total: ${total} | Showing: ${items.length}\n`);
  items.slice(0, 5).forEach((a, i) => {
    const compressed = a.compression?.compressed ? '[cNFT]' : '[NFT]';
    console.log(`  ${i + 1}. ${a.content.metadata.name || '(unnamed)'} ${compressed}`);
    console.log(`     Mint: ${a.id}`);
  });

  // 2. Token balances (no add-on needed)
  console.log('\n── Token Balances ─────────────────────────────');
  const tokens = await kit.getTokenAccounts(wallet);
  const nonZero = tokens.filter(t => t.uiAmount > 0);
  console.log(`  ${tokens.length} accounts, ${nonZero.length} with balance:`);
  nonZero.slice(0, 5).forEach(t => {
    console.log(`  ${t.mint.slice(0, 8)}... → ${t.uiAmount.toFixed(4)}`);
  });

  console.log('\n✓ Example 2 done.\n');
}

main().catch(err => { console.error('❌', err.message ?? err); process.exit(1); });
