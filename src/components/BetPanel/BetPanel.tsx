import { useEffect, useRef, useState } from "react";
import type { Bet } from "../../types";
import {
  logIndexToPriceRange,
  timeIndexToTimeRange,
} from "../../utils/grid-math";
import "./BetPanel.css";

interface Props {
  bets: Bet[];
  balance: number;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onClearResolved: () => void;
}

const PRESET_AMOUNTS = [10, 50, 100, 500];

// Single rAF drives opacity for ALL active items at the same time
function usePulse(period = 1800) {
  const [opacity, setOpacity] = useState(1);
  useEffect(() => {
    let raf: number;
    function tick() {
      const t = (Date.now() % period) / period;
      const v = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(t * Math.PI * 2));
      setOpacity(v);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [period]);
  return opacity;
}

const EMPTY_FRAMES = [
  `[_____]\n| ??? |\n[_____]`,
  `[·····]\n| --- |\n[·····]`,
  `[░░░░░]\n| ... |\n[░░░░░]`,
  `[▒▒▒▒▒]\n| ___ |\n[▒▒▒▒▒]`,
  `[     ]\n|     |\n[     ]`,
  `[·····]\n| +++ |\n[·····]`,
];

function formatTime(ms: number) {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function EmptyArt() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.35) return;
      setFrame(Math.floor(Math.random() * EMPTY_FRAMES.length));
    }, 220);
    return () => clearInterval(t);
  }, []);
  return <pre className="empty-art">{EMPTY_FRAMES[frame]}</pre>;
}

export function BetPanel({
  bets,
  balance,
  betAmount,
  onBetAmountChange,
  onClearResolved,
}: Props) {
  const hasResolved = bets.some((b) => b.status !== "active");
  const pulseOpacity = usePulse(1800);
  const hasActive = bets.some((b) => b.status === "active");

  return (
    <div className="bet-panel">
      <div className="bet-panel__balance">
        <div className="section-label">Balance</div>
        <div className="balance-amount">
          <sup>$</sup>
          {balance.toFixed(2)}
        </div>
      </div>

      <div className="bet-panel__amount">
        <div className="section-label">Bet Amount</div>
        <div className="amount-presets">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              className={`amount-btn ${betAmount === a ? "amount-btn--active" : ""}`}
              onClick={() => onBetAmountChange(a)}
            >
              ${a}
            </button>
          ))}
        </div>
        <div className="amount-custom">
          <span className="amount-custom__prefix">$</span>
          <input
            className="amount-custom__input"
            type="number"
            min={1}
            value={betAmount}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v > 0) onBetAmountChange(v);
            }}
          />
        </div>
      </div>

      <div className="bet-panel__header">
        <span className="section-label">
          Bets <span className="bet-count">{bets.length}</span>
        </span>
        {hasResolved && (
          <button className="clear-btn" onClick={onClearResolved}>
            Clear
          </button>
        )}
      </div>

      <div className="bet-panel__list">
        {bets.length === 0 ? (
          <div className="bet-panel__empty">
            <EmptyArt />
            <p className="empty-text">
              click a cell
              <br />
              to place a bet
            </p>
          </div>
        ) : (
          [...bets].reverse().map((bet) => {
            const pr = logIndexToPriceRange(bet.cellPriceIndex);
            const tr = timeIndexToTimeRange(bet.cellTimeIndex);
            const isActive = bet.status === "active";

            return (
              <div key={bet.id} className={`bet-item bet-item--${bet.status}`}>
                <div className="bet-item__top">
                  <span
                    className={`bet-status bet-status--${bet.status}`}
                    style={isActive ? { opacity: pulseOpacity } : undefined}
                  >
                    {isActive
                      ? "// PENDING"
                      : bet.status === "won"
                        ? "// WIN"
                        : bet.status === "lost"
                          ? "// LOSS"
                          : "// EXPIRED"}
                  </span>
                  <span
                    className="bet-odds"
                    style={isActive ? { opacity: pulseOpacity } : undefined}
                  >
                    {bet.odds.toFixed(2)}x
                  </span>
                </div>
                <div className="bet-price">
                  ${pr.low.toFixed(1)} — ${pr.high.toFixed(1)}
                </div>
                <div className="bet-time">
                  {formatTime(tr.start)} — {formatTime(tr.end)}
                </div>
                <div className="bet-amount">
                  ${bet.amount}
                  {bet.status === "won" && (
                    <span className="bet-pnl bet-pnl--won">
                      +${(bet.amount * bet.odds - bet.amount).toFixed(2)}
                    </span>
                  )}
                  {bet.status === "lost" && (
                    <span className="bet-pnl bet-pnl--lost">
                      -${bet.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bet-panel__legend">
        <div className="legend-item">
          <div className="legend-dot legend-dot--bettable" />
          <span>Bettable</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot--locked" />
          <span>Locked</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot--present" />
          <span>Present</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot legend-dot--past" />
          <span>Past</span>
        </div>
      </div>
    </div>
  );
}
