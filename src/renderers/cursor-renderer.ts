import { AXIS_BOTTOM_HEIGHT, AXIS_RIGHT_WIDTH } from '../lib/constants'
import { getCellState, cellToPixelRect, logIndexToPriceRange, timeIndexToTimeRange, xToTimestamp, yToPrice } from '../utils/grid-math'
import { CROSSHAIR_COLOR, HOVER_CELL_COLOR, AXIS_TAG_BG, AXIS_TAG_TEXT } from '../utils/color-palette'
import type { CellCoord, Viewport, CanvasDimensions } from '../types'

export interface CursorState {
  mouseX: number
  mouseY: number
  hoveredCell: CellCoord | null
}

export function renderCursor(
  ctx: CanvasRenderingContext2D,
  cursor: CursorState,
  viewport: Viewport,
  dims: CanvasDimensions,
  now: number,
  odds: number | null
) {
  const chartWidth = dims.width - AXIS_RIGHT_WIDTH
  const chartHeight = dims.height - AXIS_BOTTOM_HEIGHT
  const { effectiveCellPx } = viewport
  const { mouseX, mouseY } = cursor

  if (mouseX < 0 || mouseY < 0 || mouseX > chartWidth || mouseY > chartHeight) return

  // Crosshair
  ctx.strokeStyle = CROSSHAIR_COLOR
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, chartHeight)
  ctx.moveTo(0, mouseY); ctx.lineTo(chartWidth, mouseY)
  ctx.stroke()
  ctx.setLineDash([])

  // Time tag
  const ts = xToTimestamp(mouseX, viewport.startTime, effectiveCellPx)
  const d = new Date(ts)
  const timeTag = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
  const ttW = 64
  const ttX = Math.max(0, Math.min(chartWidth - ttW, mouseX - ttW / 2))
  ctx.fillStyle = AXIS_TAG_BG
  ctx.beginPath(); ctx.roundRect(ttX, chartHeight + 2, ttW, 20, 3); ctx.fill()
  ctx.fillStyle = AXIS_TAG_TEXT
  ctx.font = 'bold 11px "IBM Plex Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(timeTag, ttX + ttW / 2, chartHeight + 16)

  // Price tag
  const hoverPrice = yToPrice(mouseY, viewport.logCenterPrice, chartHeight, effectiveCellPx)
  const ptW = AXIS_RIGHT_WIDTH - 4
  const ptY = Math.max(0, Math.min(chartHeight - 20, mouseY - 10))
  ctx.fillStyle = AXIS_TAG_BG
  ctx.beginPath(); ctx.roundRect(chartWidth + 2, ptY, ptW, 20, 3); ctx.fill()
  ctx.fillStyle = AXIS_TAG_TEXT
  ctx.font = 'bold 11px "IBM Plex Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(hoverPrice.toFixed(2), chartWidth + 6, ptY + 14)

  // Hovered cell
  if (cursor.hoveredCell) {
    const rect = cellToPixelRect(
      cursor.hoveredCell.timeIndex, cursor.hoveredCell.priceIndex,
      viewport.startTime, viewport.logCenterPrice, chartHeight, effectiveCellPx
    )
    const state = getCellState(cursor.hoveredCell.timeIndex, now)

    ctx.save()
    ctx.beginPath(); ctx.rect(0, 0, chartWidth, chartHeight); ctx.clip()
    ctx.fillStyle = HOVER_CELL_COLOR
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    ctx.strokeStyle = state === 'bettable' ? 'rgba(173, 255, 47, 0.5)' : 'rgba(130, 140, 160, 0.3)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
    ctx.restore()

    // Tooltip
    const pr = logIndexToPriceRange(cursor.hoveredCell.priceIndex)
    const tr = timeIndexToTimeRange(cursor.hoveredCell.timeIndex)
    const sd = new Date(tr.start)
    const lines = [
      `${pr.low.toFixed(1)} - ${pr.high.toFixed(1)}`,
      `${sd.getHours().toString().padStart(2,'0')}:${sd.getMinutes().toString().padStart(2,'0')}:${sd.getSeconds().toString().padStart(2,'0')}`,
      state === 'bettable' && odds !== null ? `Odds: ${odds.toFixed(2)}x` : state === 'locked' ? 'LOCKED' : null,
    ].filter(Boolean) as string[]

    const tW = 140, tH = lines.length * 18 + 12
    const tX = Math.min(mouseX + 14, chartWidth - tW - 4)
    const tY = Math.max(mouseY - tH - 8, 4)
    ctx.fillStyle = 'rgba(12, 12, 12, 0.96)'
    ctx.beginPath(); ctx.roundRect(tX, tY, tW, tH, 4); ctx.fill()
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.8)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(tX, tY, tW, tH, 4); ctx.stroke()
    ctx.font = '11px "IBM Plex Mono", monospace'
    lines.forEach((line, i) => {
      const isOdds = i === lines.length - 1 && state === 'bettable' && odds !== null
      ctx.fillStyle = isOdds ? '#ADFF2F' : 'rgba(144, 144, 144, 0.95)'
      if (isOdds) ctx.font = 'bold 12px "IBM Plex Mono", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(line, tX + 10, tY + 20 + i * 18)
      if (isOdds) ctx.font = '11px "IBM Plex Mono", monospace'
    })
  }
}
