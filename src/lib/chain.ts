// Public Initia testnet EVM rollup (the hackathon chain).
// Registry entry: https://registry.testnet.initia.xyz/chains.json (chain_id=evm-1)

export const GAME_CHAIN_ID = "evm-1";

// ERC20-wrapped bridged uinit from L1 initiation-2 (bridge id 1459).
// This denom is both the game token AND the fee token for evm-1.
export const INIT_DENOM = "evm/2eE7007DF876084d4C74685e90bB7f4cd7c86e22";
export const INIT_DECIMALS = 18;
export const INIT_SYMBOL = "INIT";

// Placeholder treasury — swap for the game contract's bech32 address once deployed.
// For the smoke test we self-send (user → user) so nothing is actually lost.
export const TREASURY_ADDRESS = "init1ndw785vg6gmww8kmm2ap2lzd3zx4pj7dag0eul";

export const L1_CHAIN_ID = "initiation-2";
export const L1_BRIDGE_DENOM = "uinit";

export function toInitBaseUnits(display: number): string {
  // Use string math to avoid float rounding for 18-decimal amounts.
  const [whole, frac = ""] = display.toString().split(".");
  const fracPadded = (frac + "0".repeat(INIT_DECIMALS)).slice(0, INIT_DECIMALS);
  const combined = `${whole}${fracPadded}`.replace(/^0+/, "") || "0";
  return combined;
}

export function fromInitBaseUnits(base: string | number): number {
  const s = typeof base === "string" ? base : base.toString();
  const padded = s.padStart(INIT_DECIMALS + 1, "0");
  const whole = padded.slice(0, padded.length - INIT_DECIMALS);
  const frac = padded.slice(padded.length - INIT_DECIMALS);
  return Number(`${whole}.${frac}`);
}
