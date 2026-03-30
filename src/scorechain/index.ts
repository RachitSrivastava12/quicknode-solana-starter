import type {
  QNConfig,
  AssessWalletRiskOptions,
  WalletRiskAssessment,
} from '../types';
import { requireAddOn } from '../utils/addon-guard';
import { httpGet } from '../utils/http';

// Scorechain Risk Assessment API
// Docs: https://docs.scorechain.com
// AML/CFT compliance, wallet risk scoring, and transaction monitoring.
// Mounted at /scorechain/v1/ on the QuickNode endpoint.

function base(config: QNConfig): string {
  return config.endpointUrl.replace(/\/$/, '') + '/scorechain/v1';
}

// Get AML/CFT risk score for any Solana (or other) wallet address
export async function assessWalletRisk(
  config: QNConfig,
  options: AssessWalletRiskOptions
): Promise<WalletRiskAssessment> {
  requireAddOn(config, 'scorechain');
  const network = options.network ?? 'solana';
  const qs = new URLSearchParams({ address: options.address, network });
  return httpGet<WalletRiskAssessment>(`${base(config)}/risk?${qs}`, config.timeout);
}

// Convenience: returns true if the wallet is considered safe to interact with
export async function isWalletSafe(
  config: QNConfig,
  address: string
): Promise<boolean> {
  const assessment = await assessWalletRisk(config, { address });
  return assessment.amlStatus === 'clean' && assessment.riskLevel === 'low';
}
