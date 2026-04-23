import { useState } from "react";
import "./DepositGate.css";

const DEPOSIT_PRESETS = [100, 500, 1000, 5000];

interface Props {
  walletConnected: boolean;
  pending: boolean;
  error: string | null;
  onDeposit: (amount: number) => void;
}

export function DepositGate({
  walletConnected,
  pending,
  error,
  onDeposit,
}: Props) {
  const [depositAmount, setDepositAmount] = useState(1000);

  return (
    <div className="deposit-gate">
      <div className="deposit-gate__card">
        <div className="deposit-gate__title">// Deposit to start betting</div>
        <div className="deposit-gate__hint">
          Stake INIT on evm-1 to open a session
        </div>

        <div className="deposit-gate__presets">
          {DEPOSIT_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              className={`deposit-gate__preset ${depositAmount === a ? "deposit-gate__preset--active" : ""}`}
              onClick={() => setDepositAmount(a)}
            >
              {a} INIT
            </button>
          ))}
        </div>

        <div className="deposit-gate__input">
          <input
            type="number"
            min={1}
            value={depositAmount}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v > 0) setDepositAmount(v);
            }}
          />
          <span className="deposit-gate__input-suffix">INIT</span>
        </div>

        <button
          type="button"
          className="deposit-gate__cta"
          disabled={depositAmount <= 0 || pending}
          onClick={() => onDeposit(depositAmount)}
        >
          {pending
            ? "Signing…"
            : walletConnected
              ? "Deposit and Start"
              : "Connect Wallet to Start"}
        </button>

        {error && <div className="deposit-gate__error">{error}</div>}
      </div>
    </div>
  );
}
