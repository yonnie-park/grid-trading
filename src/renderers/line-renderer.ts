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

  // Collect visible points first
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < buffer.size; i++) {
    const p = buffer.get(i)
    if (!p || p.timestamp < startTime - 5_000 || p.timestamp > endTime + 5_000) continue
    if (!isFinite(p.price) || p.price <= 0) continue
    const x = timestampToX(p.timestamp, startTime, effectiveCellPx)
    const y = priceToY(p.price, logCenterPrice, chartHeight, effectiveCellPx)
    if (!isFinite(x) || !isFinite(y)) continue
    pts.push({ x, y })
  }
  // Sort by x so out-of-order timestamps don't cause spikes
  pts.sort((a, b) => a.x - b.x)

  if (pts.length >= 2) {
    const last = pts[pts.length - 1]
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // Grey body
    ctx.strokeStyle = 'rgba(160,160,160,0.6)'
    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y)
      else ctx.lineTo(pts[i].x, pts[i].y)
    }
    ctx.stroke()

    // Neon green tip — last 100px, fading in from grey
    const NEON_PX = 100
    const tipPts = pts.filter(p => last.x - p.x <= NEON_PX)
    if (tipPts.length >= 2) {
      const n = tipPts.length
      for (let i = 1; i < n; i++) {
        const t = i / (n - 1)                     // 0 = start of tip, 1 = newest
        const r = Math.round(160 * (1 - t) + 173 * t)
        const g = Math.round(160 * (1 - t) + 255 * t)
        const b = Math.round(160 * (1 - t) +  47 * t)
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.6 + 0.4 * t})`
        ctx.beginPath()
        ctx.moveTo(tipPts[i - 1].x, tipPts[i - 1].y)
        ctx.lineTo(tipPts[i].x, tipPts[i].y)
        ctx.stroke()
      }
    }
  }

  // Current price dashed line
  const last = buffer.last()
  if (last) {
    const lastY = priceToY(last.price, logCenterPrice, chartHeight, effectiveCellPx)
    const lastX = pts.length > 0 ? pts[pts.length - 1].x : chartWidth

    // Glow dot at latest price point
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300)
    const outerR = 6 + 2 * pulse
    const glow = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, outerR * 3)
    glow.addColorStop(0,   `rgba(173,255,47,${0.9})`)
    glow.addColorStop(0.3, `rgba(173,255,47,${0.4 * pulse})`)
    glow.addColorStop(1,   `rgba(173,255,47,0)`)
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(lastX, lastY, outerR * 3, 0, Math.PI * 2)
    ctx.fill()

    // Solid core
    ctx.fillStyle = '#ADFF2F'
    ctx.beginPath()
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
    ctx.fill()
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