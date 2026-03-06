import { useCallback, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { BetPanel } from "./components/BetPanel/BetPanel";
import { TradingCanvas } from "./components/TradingCanvas/TradingCanvas";
import { Leaderboard } from "./components/Leaderboard/Leaderboard";
import { usePriceStream } from "./hooks/usePriceStream";
import { useBettingEngine } from "./hooks/useBettingEngine";
import "./App.css";

export function App() {
  const [mode, setMode] = useState<"binance" | "mock">("binance");
  const [betAmount, setBetAmount] = useState(100);
  const [followPrice, setFollowPrice] = useState(true);
  const { bufferRef, currentPrice, status } = usePriceStream(mode);
  const {
    bets,
    betsRef,
    balance,
    placeBet,
    getOdds,
    clearResolved,
    wonIds,
    clearWonId,
  } = useBettingEngine(bufferRef, currentPrice);

  const { address, username, openConnect, openWallet } = useInterwovenKit();

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "binance" ? "mock" : "binance"));
  }, []);

  const handleCellClick = useCallback(
    (cell: Parameters<typeof placeBet>[0]) => {
      placeBet(cell, betAmount);
    },
    [placeBet, betAmount],
  );

  return (
    <div className="app">
      <StatusBar
        status={status}
        currentPrice={currentPrice}
        mode={mode}
        onToggleMode={toggleMode}
        walletAddress={address ?? null}
        walletUsername={username ?? null}
        onConnectWallet={address ? openWallet : openConnect}
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
        </div>
        <div className="app__panel">
          <BetPanel
            bets={bets}
            balance={balance}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onClearResolved={clearResolved}
          />
        </div>
      </div>
    </div>
  );
}
