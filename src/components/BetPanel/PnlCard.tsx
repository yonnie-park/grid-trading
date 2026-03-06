import { useEffect, useRef } from "react";
import type { Bet } from "../../types";
import { logIndexToPriceRange } from "../../utils/grid-math";
import "./PnlCard.css";

interface Props {
  bet: Bet;
  onClose: () => void;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawCard(canvas: HTMLCanvasElement, bet: Bet) {
  const W = 1572 * 0.5,
    H = 972 * 0.5;
  const R = 100;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.style.borderRadius = `${R}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const isWon = bet.status === "won";
  const pnl = isWon ? bet.amount * bet.odds - bet.amount : -bet.amount;
  const pnlPct = (pnl / bet.amount) * 100;
  const { low, high } = logIndexToPriceRange(bet.cellPriceIndex);

  // ── Clip to rounded rect ──
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, R);
  ctx.clip();

  // ── Background ──
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // ── BG SVG image ──
  try {
    const bgImg = await loadImage(isWon ? "/bg.png" : "/jennie.png");
    ctx.globalAlpha = 0.18;
    ctx.drawImage(bgImg, 0, 0, W, H);
    ctx.globalAlpha = 1;
  } catch {}

  // ── Logo SVG ──
  ctx.save();
  try {
    const logo = await loadImage("/logo.svg");
    const logoH = 28;
    const logoW = (logo.width / logo.height) * logoH;
    ctx.drawImage(logo, 60, 48, logoW, logoH);
  } catch {
    // fallback text
    ctx.font = 'bold 22px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#ADFF2F";
    ctx.textAlign = "left";
    ctx.fillText("griddy.", 60, 54);
  }
  ctx.restore();

  // ── Ticker ──
  ctx.font = 'bold 28px "IBM Plex Mono", monospace';
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("BTCUSDT", 60, 170);

  // ── Sub label ──
  ctx.font = '13px "IBM Plex Mono", monospace';
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText(
    `${isWon ? "win" : "loss"}  |  ${bet.odds.toFixed(2)}x odds`,
    60,
    190,
  );

  // ── Big PnL % ──
  const pnlStr = `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}`;
  ctx.font = 'bold 100px "IBM Plex Mono", monospace';
  ctx.fillStyle = isWon ? "#ADFF2F" : "#FF6B6B";
  ctx.fillText(pnlStr, 60, 300);
  const pnlMetrics = ctx.measureText(pnlStr);
  ctx.font = 'bold 36px "IBM Plex Mono", monospace';
  ctx.fillText(" %", 60 + pnlMetrics.width, 300);

  // ── Divider ──
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 380);
  ctx.lineTo(W - 36, 380);
  ctx.stroke();

  // ── Stats ──
  const stats = [
    { label: "bet amount", value: `$${bet.amount}` },
    {
      label: "payout",
      value: isWon ? `$${(bet.amount * bet.odds).toFixed(2)}` : "$0",
    },
    { label: "price range", value: `$${low.toFixed(0)}-${high.toFixed(0)}` },
  ];
  stats.forEach((s, i) => {
    const x = 60 + i * 134;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.textAlign = "left";
    ctx.fillText(s.label, x, 400);
    ctx.font = 'bold 15px "IBM Plex Mono", monospace';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(s.value, x, 420);
  });
}

export function PnlCard({ bet, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawCard(canvasRef.current, bet);
  }, [bet]);

  const handleShare = () => {
    const isWon = bet.status === "won";
    const pnl = isWon ? bet.amount * bet.odds - bet.amount : -bet.amount;
    const pnlPct = (pnl / bet.amount) * 100;
    const text = `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% on BTC/USDT at ${bet.odds.toFixed(2)}x odds 🎯\n\nhttps://griddy-trade.vercel.app/ #griddy #BTC`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "griddy-pnl.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="pnl-card-overlay" onClick={onClose}>
      <div className="pnl-card-modal" onClick={(e) => e.stopPropagation()}>
        <canvas ref={canvasRef} className="pnl-card-canvas" />
        <div className="pnl-card-actions">
          <button
            className="pnl-btn pnl-btn--download"
            onClick={handleDownload}
          >
            ↓ Save Image
          </button>
          <button className="pnl-btn pnl-btn--share" onClick={handleShare}>
            Share on 𝕏
          </button>
        </div>
        <button className="pnl-card-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
