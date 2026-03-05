import { AXIS_BOTTOM_HEIGHT, AXIS_RIGHT_WIDTH } from '../lib/constants'
import { timestampToX, priceToY } from '../utils/grid-math'
import { PRICE_LINE_COLOR, CURRENT_PRICE_LINE_COLOR, AXIS_TAG_BG, AXIS_TAG_TEXT } from '../utils/color-palette'
import { RingBuffer } from '../lib/ring-buffer'
import type { PricePoint, Viewport, CanvasDimensions } from '../types'

export function renderPriceLine(
  ctx: CanvasRenderingContext2D,
  buffer: RingBuffer<PricePoint>,
  viewport: Viewport,
  dims: CanvasDimensions
) {
  if (buffer.size === 0) return
  const chartWidth = dims.width - AXIS_RIGHT_WIDTH
  const chartHeight = dims.height - AXIS_BOTTOM_HEIGHT
  const { startTime, endTime, logCenterPrice, effectiveCellPx } = viewport

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, chartWidth, chartHeight)
  ctx.clip()

  ctx.strokeStyle = PRICE_LINE_COLOR
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()

  let started = false
  for (let i = 0; i < buffer.size; i++) {
    const p = buffer.get(i)
    if (!p || p.timestamp < startTime - 60_000 || p.timestamp > endTime) continue
    const x = timestampToX(p.timestamp, startTime, effectiveCellPx)
    const y = priceToY(p.price, logCenterPrice, chartHeight, effectiveCellPx)
    if (!started) { ctx.moveTo(x, y); started = true }
    else ctx.lineTo(x, y)
  }
  if (started) ctx.stroke()

  // Current price dashed line
  const last = buffer.last()
  if (last) {
    const lastY = priceToY(last.price, logCenterPrice, chartHeight, effectiveCellPx)
    ctx.strokeStyle = CURRENT_PRICE_LINE_COLOR
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(0, lastY)
    ctx.lineTo(chartWidth, lastY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    // Price tag
    const tagH = 20
    const tagW = AXIS_RIGHT_WIDTH - 4
    const tagY = Math.max(0, Math.min(chartHeight - tagH, lastY - tagH / 2))
    ctx.fillStyle = AXIS_TAG_BG
    ctx.beginPath()
    ctx.roundRect(chartWidth + 2, tagY, tagW, tagH, 3)
    ctx.fill()
    ctx.fillStyle = AXIS_TAG_TEXT
    ctx.font = 'bold 11px "IBM Plex Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(last.price.toFixed(2), chartWidth + 6, tagY + 14)
  } else {
    ctx.restore()
  }
}
