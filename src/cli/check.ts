import 'dotenv/config';
import { checkAddOns } from '../addons';

async function main() {
  const endpoint = process.env.QN_ENDPOINT_URL;

  if (!endpoint) {
    console.error('\n  ❌  QN_ENDPOINT_URL not set in .env\n');
    console.error('  1. Copy .env.example → .env');
    console.error('  2. Paste your QuickNode endpoint URL');
    console.error('  3. Get one free at: https://dashboard.quicknode.com\n');
    process.exit(1);
  }

  const result = await checkAddOns({ endpointUrl: endpoint });

  const g = (s: string) => `\x1b[32m${s}\x1b[0m`;
  const r = (s: string) => `\x1b[31m${s}\x1b[0m`;
  const y = (s: string) => `\x1b[33m${s}\x1b[0m`;
  const b = (s: string) => `\x1b[1m${s}\x1b[0m`;
  const d = (s: string) => `\x1b[2m${s}\x1b[0m`;
  const c = (s: string) => `\x1b[36m${s}\x1b[0m`;

  console.log('\n' + b('  @quicknode/solana-kit — Add-on Status'));
  console.log(d('  ' + '─'.repeat(55)));
  console.log(d(`  Endpoint: ${endpoint.slice(0, 52)}...`));
  console.log(d('  ' + '─'.repeat(55)));

  for (const addon of result.addOns) {
    const icon   = addon.enabled ? g('✓') : r('✗');
    const tier   = addon.tier === 'free' ? g('[FREE]') : y('[PAID]');
    const status = addon.enabled ? g('enabled') : d('not enabled');
    console.log(`\n  ${icon} ${b(addon.name)} ${tier}`);
    console.log(`    ${status} — ${addon.description}`);
    if (!addon.enabled) console.log(c(`    Enable: ${addon.enableUrl}`));
  }

  console.log('\n' + d('  ' + '─'.repeat(55)));
  console.log(b('\n  Features Available:\n'));

  const features = [
    { name: 'Smart Transactions (auto fees + retry)',  ok: result.canUse.smartTransactions },
    { name: 'NFT / Digital Asset Queries',             ok: result.canUse.nftQueries        },
    { name: 'Jupiter Token Swaps',                     ok: result.canUse.swaps             },
    { name: 'Yellowstone gRPC Streaming',              ok: result.canUse.yellowstoneStream  },
    { name: 'Jito Bundle (MEV protection)',            ok: result.canUse.jitoBundle        },
    { name: 'WebSocket Streaming (always available)',  ok: true                             },
  ];

  for (const f of features) {
    console.log(`  ${f.ok ? g('✓') : r('✗')}  ${f.ok ? f.name : d(f.name)}`);
  }

  const freeDisabled = result.addOns.filter(a => a.tier === 'free' && !a.enabled);
  if (freeDisabled.length > 0) {
    console.log(y('\n  Tip: Enable the free add-ons above to unlock more features.'));
    console.log(d('  It takes about 30 seconds in the QuickNode dashboard.\n'));
  } else {
    console.log(g('\n  ✓ All free add-ons enabled. Run the examples:\n'));
    console.log(d('  npm run example:tx'));
    console.log(d('  npm run example:nft'));
    console.log(d('  npm run example:stream\n'));
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
