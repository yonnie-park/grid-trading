import { useState } from "react";
import "./Leaderboard.css";

interface LeaderboardEntry {
  rank: number;
  name: string;
  pnl: number;
  winRate: number;
  bets: number;
}

const DUMMY_DATA: LeaderboardEntry[] = [
  { rank: 1, name: "init1xk9...3f2a", pnl: 12480.5, winRate: 68, bets: 142 },
  { rank: 2, name: "init1mq7...9c1d", pnl: 8920.0, winRate: 61, bets: 98 },
  { rank: 3, name: "init1zt3...7e4b", pnl: 6750.25, winRate: 57, bets: 203 },
  { rank: 4, name: "init1pw2...2a8f", pnl: 4310.75, winRate: 54, bets: 77 },
  { rank: 5, name: "init1ar5...5d6c", pnl: 3200.0, winRate: 52, bets: 61 },
  { rank: 6, name: "init1bv8...1b3e", pnl: 2890.5, winRate: 50, bets: 115 },
  { rank: 7, name: "init1cy1...8f9a", pnl: 1740.0, winRate: 49, bets: 44 },
  { rank: 8, name: "init1dn4...4c7d", pnl: 980.25, winRate: 47, bets: 33 },
  { rank: 9, name: "init1ej7...0e2b", pnl: 450.0, winRate: 45, bets: 28 },
  { rank: 10, name: "init1fk0...6a5f", pnl: 120.75, winRate: 43, bets: 19 },
];

const RANK_LABELS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function Leaderboard() {
  const [open, setOpen] = useState(true);

  return (
    <div className={`leaderboard ${open ? "leaderboard--open" : ""}`}>
      <button
        className="leaderboard__toggle"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="leaderboard__toggle-label">PNL</span>
        <span className="leaderboard__toggle-arrow">{open ? "◀" : "▶"}</span>
      </button>

      {open && (
        <div className="leaderboard__panel">
          <div className="leaderboard__header">
            <span className="section-label">// PNL LEADERBOARD</span>
            <span className="leaderboard__tag">DUMMY</span>
          </div>
          <div className="leaderboard__list">
            {DUMMY_DATA.map((entry) => (
              <div
                key={entry.rank}
                className={`lb-row ${entry.rank <= 3 ? "lb-row--top" : ""}`}
              >
                <span className="lb-rank">
                  {RANK_LABELS[entry.rank] ?? `#${entry.rank}`}
                </span>
                <span className="lb-name">{entry.name}</span>
                <div className="lb-right">
                  <span className="lb-pnl">
                    +$
                    {entry.pnl.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="lb-winrate">{entry.winRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
