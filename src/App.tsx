import { useCallback, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { BetPanel } from "./components/BetPanel/BetPanel";
import { TradingCanvas } from "./components/TradingCanvas/TradingCanvas";
import { usePriceStream } from "./hooks/usePriceStream";
import { useBettingEngine } from "./hooks/useBettingEngine";
import "./App.css";

export function App() {
  const [mode, setMode] = useState<"binance" | "mock">("binance");
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
      />
      <div className="app__body">
        <div className="app__chart">
          <TradingCanvas
            bufferRef={bufferRef}
            betsRef={betsRef}
            wonIds={wonIds}
            onCellClick={placeBet}
            getOdds={getOdds}
            onClearWonId={clearWonId}
          />
        </div>
        <div className="app__panel">
          <BetPanel
            bets={bets}
            balance={balance}
            onClearResolved={clearResolved}
          />
        </div>
      </div>
    </div>
  );
}
