import { useAccount } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import type { ConnectionStatus } from "../../types";
import "./StatusBar.css";

interface Props {
  status: ConnectionStatus;
  currentPrice: number | null;
  mode: "binance" | "mock";
  onToggleMode: () => void;
  walletAddress: string | null;
  walletUsername: string | null;
  onConnectWallet: () => void;
  followPrice: boolean;
  onToggleFollow: () => void;
}

function truncate(str: string) {
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-6)}`;
}

const DEPOSIT_DENOMS = [
  "ibc/47AF4A6CDA325C23BD5ED7EE43835B74AB5D51AD398F7F559DD6A67B7BE41E63",
];

export function StatusBar({
  status,
  currentPrice,
  mode,
  onToggleMode,
  walletAddress,
  walletUsername,
  onConnectWallet,
  followPrice,
  onToggleFollow,
}: Props) {
  const { connector } = useAccount();
  const { openDeposit } = useInterwovenKit();
  const walletIcon = connector?.icon;
  const displayName =
    walletUsername ?? (walletAddress ? truncate(walletAddress) : null);

  const handleDeposit = () => {
    openDeposit({ denoms: DEPOSIT_DENOMS, chainId: "initiation-2" });
  };

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <img
          src="/logo.svg"
          alt="logo"
          className="status-logo"
          onClick={() => (window.location.href = "/")}
          style={{ cursor: "pointer" }}
        />
        <div className="status-bar__divider" />
        <div className={`status-dot status-dot--${status}`} />
        <span className="status-pair">BTC/USDT</span>
        {currentPrice !== null && (
          <span className="status-price">{currentPrice.toFixed(2)}</span>
        )}
      </div>
      <div className="status-bar__right">
        <button
          className={`status-badge status-badge--follow ${followPrice ? "status-badge--follow-on" : ""}`}
          onClick={onToggleFollow}
          title="Follow price"
        >
          {followPrice ? "⊙ Follow" : "⊙ Follow"}
        </button>
        <button
          className="status-badge status-badge--mock"
          onClick={onToggleMode}
        >
          {mode === "mock" ? "Mock" : "Binance"}
        </button>
        {displayName && (
          <button
            className="status-badge status-badge--deposit"
            onClick={handleDeposit}
          >
            Deposit
          </button>
        )}
        {displayName ? (
          <button
            className="status-badge status-badge--wallet status-badge--connected"
            onClick={onConnectWallet}
          >
            {walletIcon ? (
              <img src={walletIcon} alt="wallet" className="wallet-icon" />
            ) : (
              <span className="wallet-dot" />
            )}
            {displayName}
          </button>
        ) : (
          <button
            className="status-badge status-badge--wallet"
            onClick={onConnectWallet}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
