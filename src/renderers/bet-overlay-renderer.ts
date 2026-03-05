import { AXIS_BOTTOM_HEIGHT, AXIS_RIGHT_WIDTH } from '../lib/constants'
import { cellToPixelRect } from '../utils/grid-math'
import { getBetStatusColor, getBetBorderColor } from '../utils/color-palette'
import type { Bet, Viewport, CanvasDimensions } from '../types'

export function renderBetOverlays(
  ctx: CanvasRenderingContext2D,
  bets: Bet[],
  viewport: Viewport,
  dims: CanvasDimensions
) {
  const chartWidth = dims.width - AXIS_RIGHT_WIDTH
  const chartHeight = dims.height - AXIS_BOTTOM_HEIGHT
  const { startTime, logCenterPrice, effectiveCellPx } = viewport

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, chartWidth, chartHeight)
  ctx.clip()

  for (const bet of bets) {
    const rect = cellToPixelRect(bet.cellTimeIndex, bet.cellPriceIndex, startTime, logCenterPrice, chartHeight, effectiveCellPx)
    if (rect.x + rect.w < 0 || rect.x > chartWidth) continue
    if (rect.y + rect.h < 0 || rect.y > chartHeight) continue

    ctx.fillStyle = getBetStatusColor(bet.status)
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h)

    ctx.strokeStyle = getBetBorderColor(bet.status)
    ctx.lineWidth = bet.status === 'active' ? 1.5 : 1
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)

    // Active pulse glow
    if (bet.status === 'active') {
      ctx.strokeStyle = 'rgba(173, 255, 47, 0.2)'
      ctx.lineWidth = 4
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
    }

    if (rect.w > 20) {
      ctx.fillStyle = bet.status === 'active'
        ? 'rgba(173, 255, 47, 0.9)'
        : 'rgba(239, 239, 239, 0.85)'
      ctx.font = `bold ${Math.max(8, Math.min(11, rect.w * 0.28))}px "IBM Plex Mono", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${bet.odds.toFixed(1)}x`, rect.x + rect.w / 2, rect.y + rect.h / 2)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
    }
  }

  ctx.restore()
}
