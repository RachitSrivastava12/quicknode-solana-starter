/**
 * Example 4: Jupiter Swap Quote (via Metis add-on)
 * Tests: getSwapQuote (quote only by default — no funds spent)
 * Requires: QN_ENDPOINT_URL, ADDON_METIS=true
 * Set EXECUTE_SWAP=true + WALLET_PRIVATE_KEY to actually execute
 */
import 'dotenv/config';
import { Keypair } from '@solana/web3.js';
import { QNSolanaKit, TOKENS } from '../src';
import bs58 from 'bs58';

async function main() {
  if (!process.env.QN_ENDPOINT_URL) { console.error('❌ Set QN_ENDPOINT_URL in .env'); process.exit(1); }

  const kit = new QNSolanaKit({
    endpointUrl: process.env.QN_ENDPOINT_URL,
    addOns: {
      metis:        process.env.ADDON_METIS        === 'true',
      priorityFees: process.env.ADDON_PRIORITY_FEES === 'true',
    },
  });

  console.log('\n@quicknode/solana-kit — Jupiter Swap\n');
  console.log('Token shortcuts available:');
  Object.entries(TOKENS).forEach(([k, v]) => console.log(`  TOKENS.${k.padEnd(4)} = ${v}`));

  // Quote — no cost, no execution
  console.log('\n── Getting Quote (1 SOL → USDC) ──────────────');
  const quote = await kit.getSwapQuote({
    inputMint:   TOKENS.SOL,
    outputMint:  TOKENS.USDC,
    amount:      BigInt(1_000_000_000),
    slippageBps: 50,
  });

  console.log(`  Out:          ${(Number(quote.outAmount) / 1e6).toFixed(4)} USDC`);
  console.log(`  Price impact: ${quote.priceImpactPct}%`);
  console.log(`  Route:        ${(quote.routePlan as Array<{swapInfo:{label:string}}>).map(r => r.swapInfo.label).join(' → ')}`);

  if (process.env.EXECUTE_SWAP !== 'true') {
    console.log('\n  EXECUTE_SWAP is not true — quote only, no funds spent.');
    console.log('  Set EXECUTE_SWAP=true in .env to execute.\n');
    console.log('✓ Example 4 done.\n');
    return;
  }

  if (!process.env.WALLET_PRIVATE_KEY) { console.error('❌ Set WALLET_PRIVATE_KEY in .env'); process.exit(1); }
  const signer = Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY));

  console.log('\n── Executing Swap (0.01 SOL → USDC) ──────────');
  const result = await kit.swap({
    inputMint:     TOKENS.SOL,
    outputMint:    TOKENS.USDC,
    amount:        BigInt(10_000_000),
    userPublicKey: signer.publicKey.toString(),
    signer,
    slippageBps:   100,
    feeLevel:      'recommended',
  });

  console.log('✓ Swapped!');
  console.log(`  Signature: ${result.signature}`);
  console.log(`  In:  ${(Number(result.inputAmount) / 1e9).toFixed(6)} SOL`);
  console.log(`  Out: ${(Number(result.outputAmount) / 1e6).toFixed(6)} USDC`);
  console.log(`  https://explorer.solana.com/tx/${result.signature}`);
  console.log('\n✓ Example 4 done.\n');
}

main().catch(err => { console.error('❌', err.message ?? err); process.exit(1); });
