import { useCallback, useState } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { encodeFunctionData } from "viem";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { BetPanel } from "./components/BetPanel/BetPanel";
import { TradingCanvas } from "./components/TradingCanvas/TradingCanvas";
import { Leaderboard } from "./components/Leaderboard/Leaderboard";
import { DepositGate } from "./components/DepositGate/DepositGate";
import { usePriceStream } from "./hooks/usePriceStream";
import { useBettingEngine } from "./hooks/useBettingEngine";
import {
  ERC20_APPROVE_ABI,
  GAME_CHAIN_ID,
  INIT_ERC20_ADDRESS,
  VAULT_ABI,
  VAULT_ADDRESS,
  toInitBaseUnits,
} from "./lib/chain";
import "./App.css";

function msgCall(sender: string, contractAddr: `0x${string}`, input: `0x${string}`) {
  return {
    typeUrl: "/minievm.evm.v1.MsgCall",
    value: {
      sender: sender.toLowerCase(),
      contractAddr,
      input,
      value: "0",
      accessList: [],
      authList: [],
    },
  };
}

export function App() {
  const [betAmount, setBetAmount] = useState(100);
  const [followPrice, setFollowPrice] = useState(true);
  const [depositPending, setDepositPending] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [endPending, setEndPending] = useState(false);
  const { bufferRef, currentPrice, status } = usePriceStream("binance");
  const {
    bets,
    betsRef,
    balance,
    session,
    endSession,
    startSession,
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
    requestTxBlock,
  } = useInterwovenKit();

  const handleCellClick = useCallback(
    (cell: Parameters<typeof placeBet>[0]) => {
      placeBet(cell, betAmount);
    },
    [placeBet, betAmount],
  );

  const handleDepositAndStart = useCallback(
    async (depositAmount: number) => {
      setDepositError(null);
      if (!initiaAddress || !address) {
        openConnect();
        return;
      }
      if (depositAmount <= 0) return;
      setDepositPending(true);
      try {
        const amount = BigInt(toInitBaseUnits(depositAmount));
        const approveInput = encodeFunctionData({
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, amount],
        });
        const depositInput = encodeFunctionData({
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [amount],
        });
        await requestTxBlock({
          chainId: GAME_CHAIN_ID,
          messages: [
            msgCall(initiaAddress, INIT_ERC20_ADDRESS, approveInput),
            msgCall(initiaAddress, VAULT_ADDRESS, depositInput),
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
    [address, initiaAddress, openConnect, requestTxBlock, startSession],
  );

  const handleEndAndSettle = useCallback(async () => {
    if (!initiaAddress || !address) {
      endSession();
      return;
    }
    setEndPending(true);
    try {
      const finalAmount = BigInt(toInitBaseUnits(Math.max(balance, 0)));
      const settleInput = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: "settle",
        args: [address as `0x${string}`, finalAmount],
      });
      await requestTxBlock({
        chainId: GAME_CHAIN_ID,
        messages: [msgCall(initiaAddress, VAULT_ADDRESS, settleInput)],
      });
    } catch (err) {
      // Settle failures shouldn't block the UX — the user's game state should
      // still reset locally. Log for debugging.
      console.error("settle tx failed:", err);
    } finally {
      setEndPending(false);
      endSession();
    }
  }, [address, balance, endSession, initiaAddress, requestTxBlock]);

  return (
    <div className="app">
      <StatusBar
        status={status}
        currentPrice={currentPrice}
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
          {session === "idle" && (
            <DepositGate
              walletConnected={!!initiaAddress}
              pending={depositPending}
              error={depositError}
              onDeposit={handleDepositAndStart}
            />
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
            onEndSession={handleEndAndSettle}
            endPending={endPending}
          />
        </div>
      </div>
    </div>
  );
}
