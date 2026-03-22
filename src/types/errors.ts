/**
 * Custom errors for @quicknode/solana-kit
 *
 * Every error tells the developer exactly what went wrong
 * and exactly how to fix it — no cryptic RPC errors.
 */

export class QNError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'QNError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─────────────────────────────────────────────────────────────

/**
 * Thrown when you call a method that requires a QuickNode add-on
 * that isn't enabled on your endpoint.
 *
 * How to fix: Go to https://dashboard.quicknode.com → your endpoint → Add-ons
 */
export class AddOnNotEnabledError extends QNError {
  constructor(
    public readonly addOnName: string,
    public readonly tier: 'free' | 'paid'
  ) {
    const tierNote = tier === 'free'
      ? 'This is a FREE add-on — enable it in under 30 seconds.'
      : 'This is a PAID add-on — requires a QuickNode paid plan.';

    super(
      `\n\n  ❌ Add-on not enabled: "${addOnName}"\n\n` +
      `  ${tierNote}\n\n` +
      `  How to fix:\n` +
      `  1. Go to https://dashboard.quicknode.com\n` +
      `  2. Click on your endpoint\n` +
      `  3. Go to the "Add-ons" tab\n` +
      `  4. Enable "${addOnName}"\n` +
      `  5. Set addOns.${addOnName.toLowerCase().replace(/\s/g, '')}: true in your QNSolanaKit config\n`,
      'ADD_ON_NOT_ENABLED',
      { addOnName, tier }
    );
    this.name = 'AddOnNotEnabledError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─────────────────────────────────────────────────────────────

/**
 * Thrown when a transaction is not confirmed within the timeout period.
 * Usually means the network is congested or the fee was too low.
 */
export class TransactionTimeoutError extends QNError {
  constructor(public readonly signature: string) {
    super(
      `Transaction not confirmed within timeout.\n` +
      `  Signature: ${signature}\n` +
      `  Try: increase feeLevel to 'high' or 'extreme'\n` +
      `  Explorer: https://explorer.solana.com/tx/${signature}`,
      'TX_TIMEOUT',
      { signature }
    );
    this.name = 'TransactionTimeoutError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─────────────────────────────────────────────────────────────

/**
 * Thrown when a transaction fails on-chain (e.g. slippage exceeded,
 * program error, insufficient funds for the instruction).
 */
export class TransactionFailedError extends QNError {
  constructor(
    public readonly signature: string,
    public readonly reason: unknown
  ) {
    super(
      `Transaction failed on-chain.\n` +
      `  Signature: ${signature}\n` +
      `  Reason: ${JSON.stringify(reason)}\n` +
      `  Explorer: https://explorer.solana.com/tx/${signature}`,
      'TX_FAILED',
      { signature, reason }
    );
    this.name = 'TransactionFailedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─────────────────────────────────────────────────────────────

/**
 * Thrown when the transaction fails after all retry attempts.
 */
export class MaxRetriesExceededError extends QNError {
  constructor(
    public readonly maxRetries: number,
    public readonly lastError: unknown
  ) {
    super(
      `Transaction failed after ${maxRetries} retries.\n` +
      `  Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}\n` +
      `  Try: increase maxRetries, use a higher feeLevel, or check your transaction logic.`,
      'TX_MAX_RETRIES',
      { maxRetries, lastError }
    );
    this.name = 'MaxRetriesExceededError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─────────────────────────────────────────────────────────────

/**
 * Thrown when the endpoint URL is missing or malformed.
 */
export class InvalidEndpointError extends QNError {
  constructor(url: string) {
    super(
      `Invalid QuickNode endpoint URL: "${url}"\n` +
      `  Expected: https://your-name.solana-mainnet.quiknode.pro/TOKEN/\n` +
      `  Get one free at: https://dashboard.quicknode.com`,
      'INVALID_ENDPOINT',
      { url }
    );
    this.name = 'InvalidEndpointError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─────────────────────────────────────────────────────────────

/**
 * Thrown when the RPC request itself fails (network error, bad response, etc.)
 */
export class RPCError extends QNError {
  constructor(
    method: string,
    public readonly statusCode: number,
    body: string
  ) {
    super(
      `RPC request failed.\n` +
      `  Method:  ${method}\n` +
      `  Status:  ${statusCode}\n` +
      `  Body:    ${body.slice(0, 300)}\n` +
      `  If you're seeing 403, check your endpoint URL and token.`,
      'RPC_ERROR',
      { method, statusCode, body }
    );
    this.name = 'RPCError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
