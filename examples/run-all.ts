/**
 * Run all examples in sequence.
 * Skips any that are missing required env vars.
 */
import 'dotenv/config';
import { execSync } from 'child_process';

const c = {
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:    (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
};

const examples = [
  {
    script:   'examples/1-smart-transaction.ts',
    name:     'Smart Transaction',
    requires: ['QN_ENDPOINT_URL', 'WALLET_PRIVATE_KEY'],
  },
  {
    script:   'examples/2-nft-queries.ts',
    name:     'NFT Queries (DAS)',
    requires: ['QN_ENDPOINT_URL', 'WALLET_ADDRESS'],
  },
  {
    script:   'examples/3-live-streaming.ts',
    name:     'Live Streaming',
    requires: ['QN_ENDPOINT_URL'],
    timeout:  8_000, // run for 8s then kill
  },
  {
    script:   'examples/4-jupiter-swap.ts',
    name:     'Jupiter Swap (quote only)',
    requires: ['QN_ENDPOINT_URL'],
  },
];

console.log(c.bold('\n@quicknode/solana-kit — Running All Examples\n'));

let passed = 0;
let skipped = 0;
let failed = 0;

for (const ex of examples) {
  const missing = ex.requires.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.log(`${c.yellow('⊘')} ${ex.name} ${c.dim('(skipped — missing: ' + missing.join(', ') + ')')}`);
    skipped++;
    continue;
  }

  process.stdout.write(`${c.dim('▶')} ${ex.name}... `);
  try {
    execSync(`npx ts-node ${ex.script}`, {
      stdio: 'pipe',
      env:   process.env,
      timeout: ex.timeout ?? 60_000,
    });
    console.log(c.green('✓ passed'));
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(c.red('✗ failed'));
    console.log(c.dim('  ' + msg.split('\n')[0]));
    failed++;
  }
}

console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${c.green(`${passed} passed`)}  ${c.yellow(`${skipped} skipped`)}  ${failed > 0 ? c.red(`${failed} failed`) : c.dim('0 failed')}`);
console.log();
