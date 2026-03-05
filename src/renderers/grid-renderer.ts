import { LOG_STEP, SECONDS_PER_CELL, AXIS_BOTTOM_HEIGHT, AXIS_RIGHT_WIDTH } from '../lib/constants'
import { getCellState, cellToPixelRect } from '../utils/grid-math'
import {
  getCellStateColor,
  GRID_LINE_COLOR, GRID_LINE_MAJOR_COLOR,
  AXIS_BG_COLOR, AXIS_TEXT_COLOR,
} from '../utils/color-palette'
import type { Viewport, CanvasDimensions } from '../types'

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  dims: CanvasDimensions,
  now: number,
  getOdds: (ti: number, pi: number) => number | null
) {
  const { width, height } = dims
  const { startTime, logCenterPrice, effectiveCellPx } = viewport
  const chartWidth = width - AXIS_RIGHT_WIDTH
  const chartHeight = height - AXIS_BOTTOM_HEIGHT
  const centerY = chartHeight / 2

  const startTi = Math.floor(startTime / (SECONDS_PER_CELL * 1000))
  const endTi = Math.ceil((startTime + (chartWidth / effectiveCellPx) * SECONDS_PER_CELL * 1000) / (SECONDS_PER_CELL * 1000))
  const topLog = logCenterPrice + (centerY / effectiveCellPx) * LOG_STEP
  const botLog = logCenterPrice - (centerY / effectiveCellPx) * LOG_STEP
  const startPi = Math.floor(botLog / LOG_STEP)
  const endPi = Math.ceil(topLog / LOG_STEP)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, chartWidth, chartHeight)
  ctx.clip()

  const fontSize = Math.max(9, Math.min(13, effectiveCellPx * 0.16))
  const showText = effectiveCellPx >= 36

  // Cell fills
  for (let ti = startTi; ti <= endTi; ti++) {
    const x = ((ti * SECONDS_PER_CELL * 1000 - startTime) / (SECONDS_PER_CELL * 1000)) * effectiveCellPx
    if (x + effectiveCellPx < 0 || x > chartWidth) continue

    const state = getCellState(ti, now)
    const color = getCellStateColor(state)

    for (let pi = startPi; pi <= endPi; pi++) {
      const cellTopLog = (pi + 1) * LOG_STEP
      const y = centerY - ((cellTopLog - logCenterPrice) / LOG_STEP) * effectiveCellPx
      if (y + effectiveCellPx < 0 || y > chartHeight) continue

      if (color !== 'rgba(0, 0, 0, 0)') {
        ctx.fillStyle = color
        ctx.fillRect(x, y, effectiveCellPx, effectiveCellPx)
      }

      if (state === 'bettable' && showText) {
        const odds = getOdds(ti, pi)
        if (odds !== null) {
          ctx.fillStyle = 'rgba(72, 72, 72, 0.8)'
          ctx.font = `${fontSize}px "IBM Plex Mono", monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${odds.toFixed(1)}x`, x + effectiveCellPx / 2, y + effectiveCellPx / 2)
        }
      }
    }
  }

  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'

  // Vertical grid lines
  for (let ti = startTi; ti <= endTi + 1; ti++) {
    const x = Math.round(((ti * SECONDS_PER_CELL * 1000 - startTime) / (SECONDS_PER_CELL * 1000)) * effectiveCellPx) + 0.5
    ctx.strokeStyle = ti % 12 === 0 ? GRID_LINE_MAJOR_COLOR : GRID_LINE_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, chartHeight)
    ctx.stroke()
  }

  // Horizontal grid lines
  for (let pi = startPi; pi <= endPi + 1; pi++) {
    const y = Math.round(centerY - ((pi * LOG_STEP - logCenterPrice) / LOG_STEP) * effectiveCellPx) + 0.5
    ctx.strokeStyle = pi % 10 === 0 ? GRID_LINE_MAJOR_COLOR : GRID_LINE_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(chartWidth, y)
    ctx.stroke()
  }

  ctx.restore()

  // X axis
  ctx.fillStyle = AXIS_BG_COLOR
  ctx.fillRect(0, chartHeight, width, AXIS_BOTTOM_HEIGHT)
  ctx.strokeStyle = GRID_LINE_MAJOR_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, chartHeight + 0.5)
  ctx.lineTo(width, chartHeight + 0.5)
  ctx.stroke()
  ctx.fillStyle = AXIS_TEXT_COLOR
  ctx.font = '11px "IBM Plex Mono", monospace'
  ctx.textAlign = 'center'
  for (let ti = startTi; ti <= endTi + 1; ti++) {
    if (ti % 6 !== 0) continue
    const x = ((ti * SECONDS_PER_CELL * 1000 - startTime) / (SECONDS_PER_CELL * 1000)) * effectiveCellPx
    if (x < 0 || x > chartWidth) continue
    const d = new Date(ti * SECONDS_PER_CELL * 1000)
    ctx.fillText(
      `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
      x, chartHeight + 16
    )
  }

  // Y axis
  ctx.fillStyle = AXIS_BG_COLOR
  ctx.fillRect(chartWidth, 0, AXIS_RIGHT_WIDTH, height)
  ctx.strokeStyle = GRID_LINE_MAJOR_COLOR
  ctx.beginPath()
  ctx.moveTo(chartWidth + 0.5, 0)
  ctx.lineTo(chartWidth + 0.5, height)
  ctx.stroke()
  ctx.fillStyle = AXIS_TEXT_COLOR
  ctx.font = '11px "IBM Plex Mono", monospace'
  ctx.textAlign = 'left'
  for (let pi = startPi; pi <= endPi + 1; pi++) {
    if (pi % 5 !== 0) continue
    const y = centerY - ((pi * LOG_STEP - logCenterPrice) / LOG_STEP) * effectiveCellPx
    if (y < 0 || y > chartHeight) continue
    ctx.fillText(Math.exp(pi * LOG_STEP).toFixed(1), chartWidth + 6, y + 4)
  }
}
