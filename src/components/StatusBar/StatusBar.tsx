import { useAccount } from "wagmi";
import type { ConnectionStatus } from "../../types";
import "./StatusBar.css";

interface Props {
  status: ConnectionStatus;
  currentPrice: number | null;
  walletAddress: string | null;
  walletUsername: string | null;
  onConnectWallet: () => void;
  onBridge: () => void;
  followPrice: boolean;
  onToggleFollow: () => void;
}

function truncate(str: string) {
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-6)}`;
}

export function StatusBar({
  status,
  currentPrice,
  walletAddress,
  walletUsername,
  onConnectWallet,
  onBridge,
  followPrice,
  onToggleFollow,
}: Props) {
  const { connector } = useAccount();
  const walletIcon = connector?.icon;
  const displayName =
    walletUsername ?? (walletAddress ? truncate(walletAddress) : null);

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
        {displayName && (
          <button
            className="status-badge status-badge--bridge"
            onClick={onBridge}
            title="Bridge INIT from testnet"
          >
            Bridge INIT
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
