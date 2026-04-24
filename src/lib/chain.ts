// Public Initia testnet EVM rollup (the hackathon chain).
// Registry entry: https://registry.testnet.initia.xyz/chains.json (chain_id=evm-1)

export const GAME_CHAIN_ID = "evm-1";

// ERC20-wrapped bridged uinit from L1 initiation-2 (bridge id 1459).
// This denom is both the game token AND the fee token for evm-1.
export const INIT_DENOM = "evm/2eE7007DF876084d4C74685e90bB7f4cd7c86e22";
export const INIT_DECIMALS = 18;
export const INIT_SYMBOL = "INIT";

// EVM (hex) addresses for MsgCall. contractAddr in MsgCall must be hex.
export const INIT_ERC20_ADDRESS =
  "0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22" as const;

// GriddyVault — deposit/settle escrow for the game.
// Deployed 2026-04-24 via contracts/script/DeployGriddyVault.s.sol.
export const VAULT_ADDRESS =
  "0x774ff78687710c8ee4aCa29701D919FB4AD185e5" as const;

export const L1_CHAIN_ID = "initiation-2";
export const L1_BRIDGE_DENOM = "uinit";

// Minimal ABIs — we only call approve, deposit, settle.
export const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

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
