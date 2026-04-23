import { useCallback, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { BetPanel } from "./components/BetPanel/BetPanel";
import { TradingCanvas } from "./components/TradingCanvas/TradingCanvas";
import { Leaderboard } from "./components/Leaderboard/Leaderboard";
import { usePriceStream } from "./hooks/usePriceStream";
import { useBettingEngine } from "./hooks/useBettingEngine";
import {
  GAME_CHAIN_ID,
  INIT_DENOM,
  L1_BRIDGE_DENOM,
  L1_CHAIN_ID,
  TREASURY_ADDRESS,
  toInitBaseUnits,
} from "./lib/chain";
import "./App.css";

export function App() {
  const [betAmount, setBetAmount] = useState(100);
  const [followPrice, setFollowPrice] = useState(true);
  const [depositPending, setDepositPending] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const { bufferRef, currentPrice, status } = usePriceStream("binance");
  const {
    bets,
    betsRef,
    balance,
    session,
    startSession,
    endSession,
    placeBet,
    getOdds,
    clearResolved,
    wonIds,
    clearWonId,
  } = useBettingEngine(bufferRef, currentPrice);

  const {
    address,
    initiaAddress,
    username,
    openConnect,
    openWallet,
    openBridge,
    requestTxBlock,
  } = useInterwovenKit();

  const handleCellClick = useCallback(
    (cell: Parameters<typeof placeBet>[0]) => {
      placeBet(cell, betAmount);
    },
    [placeBet, betAmount],
  );

  const handleBridge = useCallback(() => {
    openBridge({ srcChainId: L1_CHAIN_ID, srcDenom: L1_BRIDGE_DENOM });
  }, [openBridge]);

  const handleDepositAndStart = useCallback(
    async (depositAmount: number) => {
      setDepositError(null);
      if (!initiaAddress) {
        openConnect();
        return;
      }
      if (depositAmount <= 0) return;
      setDepositPending(true);
      try {
        const amount = toInitBaseUnits(depositAmount);
        await requestTxBlock({
          chainId: GAME_CHAIN_ID,
          messages: [
            {
              typeUrl: "/cosmos.bank.v1beta1.MsgSend",
              value: {
                fromAddress: initiaAddress.toLowerCase(),
                toAddress: TREASURY_ADDRESS,
                amount: [{ denom: INIT_DENOM, amount }],
              },
            },
          ],
        });
        startSession(depositAmount);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Deposit transaction failed";
        setDepositError(message);
      } finally {
        setDepositPending(false);
      }
    },
    [initiaAddress, openConnect, requestTxBlock, startSession],
  );

  return (
    <div className="app">
      <StatusBar
        status={status}
        currentPrice={currentPrice}
        walletAddress={address ?? null}
        walletUsername={username ?? null}
        onConnectWallet={address ? openWallet : openConnect}
        onBridge={handleBridge}
        followPrice={followPrice}
        onToggleFollow={() => setFollowPrice((f) => !f)}
      />
      <div className="app__body">
        <Leaderboard />
        <div className="app__chart">
          <TradingCanvas
            bufferRef={bufferRef}
            betsRef={betsRef}
            wonIds={wonIds}
            onCellClick={handleCellClick}
            getOdds={getOdds}
            onClearWonId={clearWonId}
            followPrice={followPrice}
          />
          {session === "idle" && (
            <div className="chart-overlay">
              <div className="chart-overlay__box">
                <span className="chart-overlay__title">
                  // Deposit to start betting
                </span>
                <span className="chart-overlay__hint">
                  Use the panel on the right →
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="app__panel">
          <BetPanel
            bets={bets}
            balance={balance}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onClearResolved={clearResolved}
            session={session}
            onStartSession={handleDepositAndStart}
            onEndSession={endSession}
            depositPending={depositPending}
            depositError={depositError}
            walletConnected={!!initiaAddress}
          />
        </div>
      </div>
    </div>
  );
}
