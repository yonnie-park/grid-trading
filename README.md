# Griddy

> Grid-native onchain trading game. Stake INIT, call where Bitcoin's price will sweep next, win at live odds.

**Chain**: [`evm-1`](https://scan.testnet.initia.xyz/evm-1) (Initia Interwoven Rollup, testnet)

## What it does

Griddy turns a live BTC/USDT price stream into a playable grid. Every cell is a bet — click one and you're wagering the price will pass through that (price range × time range) zone before it expires. Odds recalculate each second based on distance-to-target and remaining time.

**Two on-chain transactions per session**: deposit to start, settle to end. Everything in between — hundreds of bets, win/loss resolution, PnL — is pure frontend gameplay against a real market feed.

## Quick start

```bash
npm install
npm run dev
```

Open the Vite URL (usually http://localhost:5173) and:

1. Click **Connect Wallet** (top right)
2. If you need INIT on `evm-1`, open the wallet modal and use its bridge flow from `initiation-2`
3. Pick a deposit amount on the centered **Deposit to start betting** card and click **Deposit and Start**
4. Click any cell on the chart to place a bet
5. Click **End** in the side panel to close the session

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 6 + TypeScript |
| Chain SDK | `@initia/interwovenkit-react` 2.4.6 |
| EVM | wagmi 2 + viem |
| Rendering | HTML Canvas with a custom grid renderer |
| Data | Ring-buffered price history, Binance WebSocket feed |
| Probability | Custom probability engine + live odds calculator |

## Project structure

```
.
├── index.html                               # Vite entrypoint
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .initia/
│   └── submission.json                      # Hackathon submission metadata
├── public/                                  # Logos, backgrounds, static assets
└── src/
    ├── main.tsx                             # Providers: WagmiProvider → QueryClientProvider → InterwovenKitProvider (defaultChainId: evm-1)
    ├── App.tsx                              # Top-level layout + deposit-tx orchestration (MsgSend of bridged INIT)
    ├── App.css
    ├── index.css
    │
    ├── lib/
    │   ├── chain.ts                         # evm-1 constants (INIT denom, decimals, treasury, helpers)
    │   ├── constants.ts                     # Gameplay timing (bet lockout, default amounts)
    │   ├── math.ts                          # Log-scale price math
    │   └── ring-buffer.ts                   # Fixed-size price history
    │
    ├── hooks/
    │   ├── useBettingEngine.ts              # Session state (idle/playing), bets, balance, resolution loop
    │   ├── usePriceStream.ts                # Binance WebSocket + buffering into a ring buffer
    │   ├── useGridInteraction.ts            # Pointer → cell translation (click / hover)
    │   └── useViewport.ts                   # Canvas sizing + camera (price-follow scroll)
    │
    ├── utils/
    │   ├── odds-calculator.ts               # Live odds per cell
    │   ├── prob-engine.ts                   # Probability model (distance + time-to-expiry)
    │   ├── grid-math.ts                     # Cell ↔ (time, price) conversions
    │   └── color-palette.ts
    │
    ├── renderers/                           # Canvas draw pipelines (one per layer)
    │   ├── grid-renderer.ts                 # The grid cells with per-cell odds
    │   ├── line-renderer.ts                 # The live BTC price polyline
    │   ├── bet-overlay-renderer.ts          # User's active/resolved bets on top of the grid
    │   └── cursor-renderer.ts               # Hover highlight + crosshair
    │
    ├── components/
    │   ├── StatusBar/                       # Top bar: logo, status dot, BTC price, Follow toggle, wallet button
    │   ├── TradingCanvas/                   # Main chart — composes all renderers onto one <canvas>
    │   ├── DepositGate/                     # Centered overlay shown when session is idle (deposit form + CTA)
    │   ├── BetPanel/                        # Right sidebar (playing-state only): balance, End button, bet amount presets, bets list, PnL card
    │   └── Leaderboard/                     # Left sidebar (currently dummy data)
    │
    └── types/
        └── index.ts                         # Shared TS types (Bet, CellCoord, PricePoint, ConnectionStatus)
```

## Architecture notes

### Session lifecycle

```
idle ──[Deposit and Start → MsgSend on evm-1]──► playing ──[End → reset (future: settle tx)]──► idle
```

- `useBettingEngine` owns the state machine and exposes `session`, `balance`, `startSession`, `endSession`, `placeBet`. `placeBet` is a no-op while idle — the `DepositGate` overlay also physically blocks the canvas.
- **Deposit (only on-chain action wired today)**: signs `MsgSend` from connected address → `TREASURY_ADDRESS` (placeholder; see below) with the bridged INIT denom. On success, `startSession(depositAmount)` flips state to `playing` and seeds the UI balance.
- **End**: currently resets local state. A future iteration calls the game contract's `settle()` / `withdraw()` before resetting.

### Chain integration (`src/lib/chain.ts`)

```ts
GAME_CHAIN_ID      = "evm-1"
INIT_DENOM         = "evm/2eE7007DF876084d4C74685e90bB7f4cd7c86e22"   // ERC20-wrapped bridged uinit
INIT_DECIMALS      = 18
L1_CHAIN_ID        = "initiation-2"
L1_BRIDGE_DENOM    = "uinit"
TREASURY_ADDRESS   = "init1..."                                       // swap for deployed contract bech32
```

`evm-1` is a public testnet Interwoven Rollup registered in `registry.testnet.initia.xyz`. InterwovenKit discovers it via `defaultChainId`; no `customChain` is needed. The same denom serves as game token and fee token — minimum gas price on `evm-1` is 150 gwei.

When the game contract is deployed, two swaps are needed:

1. `TREASURY_ADDRESS` → contract's bech32 address
2. `MsgSend` in `App.tsx#handleDepositAndStart` → `MsgCall` encoding a `deposit()` call with `viem.encodeFunctionData`

### Price + grid

- `usePriceStream("binance")` pipes a Binance WebSocket into a `RingBuffer<PricePoint>` — bounded, GC-friendly.
- `TradingCanvas` reads `bufferRef` each animation frame and invokes the four `renderers/*` pipelines in order (grid → line → bet overlay → cursor).
- `useGridInteraction` maps pointer events to `{timeIndex, priceIndex}` cells using `utils/grid-math`. `utils/prob-engine` + `utils/odds-calculator` produce each cell's odds.
- Bet resolution runs on a 50ms poll inside `useBettingEngine`: when a bet's cell moves into the `past` state, the engine checks whether any buffered price fell inside the (time × price) range and marks it `won` / `lost`.

## Hackathon submission

See [`.initia/submission.json`](./.initia/submission.json) for the machine-readable metadata.

## License

MIT
