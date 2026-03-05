import { useEffect, useRef, useState } from "react";
import { RingBuffer } from "../../lib/ring-buffer";
import { BG_COLOR } from "../../lib/constants";
import { useViewport } from "../../hooks/useViewport";
import { useGridInteraction } from "../../hooks/useGridInteraction";
import { renderGrid } from "../../renderers/grid-renderer";
import { renderBetOverlays } from "../../renderers/bet-overlay-renderer";
import { renderPriceLine } from "../../renderers/line-renderer";
import { renderCursor } from "../../renderers/cursor-renderer";
import { cellToPixelRect } from "../../utils/grid-math";
import { AXIS_BOTTOM_HEIGHT, AXIS_RIGHT_WIDTH } from "../../lib/constants";
import type { PricePoint, Bet, CanvasDimensions, CellCoord } from "../../types";
import "./TradingCanvas.css";

const ASCII_CHARS = "·∙░▒│─┼+·.WZ X Z WZ X";

function makeGrid(cols: number, rows: number) {
  return Array.from({ length: rows }, () =>
    Array.from(
      { length: cols },
      () => ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)],
    ),
  );
}

// ── ASCII firework frames ──
const FIREWORK_FRAMES = [
  `  *  \n *+* \n**+**\n *+* \n  *  `,
  ` \\|/ \n- + -\n /|\\ `,
  ` ♡ ♡ \n♡     ♡\n ♡   ♡ \n  ♡ ♡  \n   ♡   `,
  `   *   \n  · · \n *   * \n*  +  *\n *   * \n  · · \n   *   `,
  `  ·   ·  \n ·     · \n·    +    ·\n ·     · \n  ·   ·  `,
  ` ♡     ♡ \n♡       ♡\n ♡     ♡ \n  ♡   ♡  \n   ♡ ♡   \n    ♡    `,
  `·       ·\n     °     \n·       ·`,
  `·         ·\n       °       \n·         ·`,
  ``,
];

interface FireworkInstance {
  id: string;
  x: number; // px from left of canvas container
  y: number; // px from top of canvas container
}

function Firework({
  x,
  y,
  onDone,
}: {
  x: number;
  y: number;
  onDone: () => void;
}) {
  const [frame, setFrame] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (frame >= FIREWORK_FRAMES.length - 1) {
      onDoneRef.current();
      return;
    }
    const t = setTimeout(() => setFrame((f) => f + 1), 65);
    return () => clearTimeout(t);
  }, [frame]);

  return (
    <pre className="canvas-firework" style={{ left: x, top: y }}>
      {FIREWORK_FRAMES[frame]}
    </pre>
  );
}

interface Props {
  bufferRef: React.RefObject<RingBuffer<PricePoint>>;
  betsRef: React.RefObject<Bet[]>;
  wonIds: Set<string>;
  onCellClick: (cell: CellCoord) => void;
  getOdds: (ti: number, pi: number) => number | null;
  onClearWonId: (id: string) => void;
}

export function TradingCanvas({
  bufferRef,
  betsRef,
  wonIds,
  onCellClick,
  getOdds,
  onClearWonId,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLDivElement>(null);
  const dimsRef = useRef<CanvasDimensions>({
    width: 1200,
    height: 600,
    dpr: 1,
  });
  const rafRef = useRef(0);
  const [fireworks, setFireworks] = useState<FireworkInstance[]>([]);
  const shownWonIds = useRef<Set<string>>(new Set());

  const { viewportRef, updateViewport, pan, zoom } = useViewport();
  const {
    cursorRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
    handleWheel,
  } = useGridInteraction(
    canvasRef,
    viewportRef,
    dimsRef,
    onCellClick,
    pan,
    zoom,
  );

  // Spawn fireworks when wonIds changes
  useEffect(() => {
    wonIds.forEach((id) => {
      if (shownWonIds.current.has(id)) return;
      shownWonIds.current.add(id);

      // Find the bet to get its cell coords
      const bet = betsRef.current.find((b) => b.id === id);
      if (!bet) return;

      const vp = viewportRef.current;
      const dims = dimsRef.current;
      const chartHeight = dims.height - AXIS_BOTTOM_HEIGHT;

      const rect = cellToPixelRect(
        bet.cellTimeIndex,
        bet.cellPriceIndex,
        vp.startTime,
        vp.logCenterPrice,
        chartHeight,
        vp.effectiveCellPx,
      );

      // Center of the cell
      const x = rect.x + rect.w / 2;
      const y = rect.y + rect.h / 2;

      // Only show if cell is visible on screen
      const chartWidth = dims.width - AXIS_RIGHT_WIDTH;
      if (x < 0 || x > chartWidth || y < 0 || y > chartHeight) return;

      setFireworks((fw) => [...fw, { id, x, y }]);
    });
  }, [wonIds, betsRef, viewportRef]);

  const removeFirework = (id: string) => {
    setFireworks((fw) => fw.filter((f) => f.id !== id));
    onClearWonId(id);
  };

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      dimsRef.current = { width, height, dpr };
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ASCII background
  useEffect(() => {
    const el = asciiRef.current;
    if (!el) return;
    const COLS = 150,
      ROWS = 72;
    const grid = makeGrid(COLS, ROWS);
    el.textContent = grid.map((r) => r.join("")).join("\n");
    const t = setInterval(() => {
      const flips = Math.floor(COLS * ROWS * 0.025);
      for (let i = 0; i < flips; i++) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        grid[r][c] =
          ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
      }
      el.textContent = grid.map((r) => r.join("")).join("\n");
    }, 80);
    return () => clearInterval(t);
  }, []);

  // Render loop
  useEffect(() => {
    function frame() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const dims = dimsRef.current;
      const now = Date.now();
      const last = bufferRef.current.last();
      if (last) updateViewport(now, last.price, dims.width);

      const vp = viewportRef.current;
      ctx.save();
      ctx.scale(dims.dpr, dims.dpr);
      ctx.clearRect(0, 0, dims.width, dims.height);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, dims.width, dims.height);

      renderGrid(ctx, vp, dims, now, getOdds);
      renderBetOverlays(ctx, betsRef.current, vp, dims);
      renderPriceLine(ctx, bufferRef.current, vp, dims);

      const cursor = cursorRef.current;
      const odds = cursor.hoveredCell
        ? getOdds(cursor.hoveredCell.timeIndex, cursor.hoveredCell.priceIndex)
        : null;
      renderCursor(ctx, cursor, vp, dims, now, odds);

      ctx.restore();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bufferRef, betsRef, viewportRef, updateViewport, getOdds, cursorRef]);

  return (
    <div ref={containerRef} className="trading-canvas">
      <div ref={asciiRef} className="trading-canvas__ascii" />
      <canvas
        ref={canvasRef}
        className={`trading-canvas__canvas ${isDragging ? "trading-canvas__canvas--dragging" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {/* Fireworks rendered over the canvas at exact cell positions */}
      {fireworks.map((fw) => (
        <Firework
          key={fw.id}
          x={fw.x}
          y={fw.y}
          onDone={() => removeFirework(fw.id)}
        />
      ))}
    </div>
  );
}
