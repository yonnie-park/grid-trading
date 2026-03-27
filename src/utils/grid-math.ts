import { LOG_STEP, SECONDS_PER_CELL, BET_LOCKOUT_MS } from '../lib/constants'
import type { CellState, CellCoord } from '../types'

export function getCellState(cellTimeIndex: number, now: number): CellState {
  const cellStartMs = cellTimeIndex * SECONDS_PER_CELL * 1000
  const cellEndMs = cellStartMs + SECONDS_PER_CELL * 1000
  if (cellEndMs <= now) return 'past'
  if (cellStartMs <= now) return 'present'
  const diff = cellStartMs - now
  if (diff < BET_LOCKOUT_MS) return 'locked'
  return 'bettable'
}

export function pixelToCellCoord(
  px: number,
  py: number,
  viewportStartTime: number,
  logCenterPrice: number,
  canvasHeight: number,
  effectiveCellPx: number
): CellCoord {
  const timeMs = viewportStartTime + (px / effectiveCellPx) * SECONDS_PER_CELL * 1000
  const timeIndex = Math.floor(timeMs / (SECONDS_PER_CELL * 1000))
  const centerY = canvasHeight / 2
  const logPrice = logCenterPrice - ((py - centerY) / effectiveCellPx) * LOG_STEP
  const priceIndex = Math.floor(logPrice / LOG_STEP)
  return { timeIndex, priceIndex }
}

export function cellToPixelRect(
  cellTimeIndex: number,
  cellPriceIndex: number,
  viewportStartTime: number,
  logCenterPrice: number,
  canvasHeight: number,
  effectiveCellPx: number
): { x: number; y: number; w: number; h: number } {
  const cellStartMs = cellTimeIndex * SECONDS_PER_CELL * 1000
  const x = ((cellStartMs - viewportStartTime) / (SECONDS_PER_CELL * 1000)) * effectiveCellPx
  const centerY = canvasHeight / 2
  const cellTopLogPrice = (cellPriceIndex + 1) * LOG_STEP
  const y = centerY - ((cellTopLogPrice - logCenterPrice) / LOG_STEP) * effectiveCellPx
  return { x, y, w: effectiveCellPx, h: effectiveCellPx }
}

export function logIndexToPriceRange(index: number): { low: number; high: number } {
  return {
    low: Math.exp(index * LOG_STEP),
    high: Math.exp((index + 1) * LOG_STEP),
  }
}

export function timeIndexToTimeRange(index: number): { start: number; end: number } {
  const start = index * SECONDS_PER_CELL * 1000
  return { start, end: start + SECONDS_PER_CELL * 1000 }
}

export function timestampToX(timestamp: number, viewportStartTime: number, effectiveCellPx: number): number {
  return ((timestamp - viewportStartTime) / (SECONDS_PER_CELL * 1000)) * effectiveCellPx
}

export function priceToY(price: number, logCenterPrice: number, canvasHeight: number, effectiveCellPx: number): number {
  const centerY = canvasHeight / 2
  return centerY - ((Math.log(price) - logCenterPrice) / LOG_STEP) * effectiveCellPx
}

export function xToTimestamp(x: number, viewportStartTime: number, effectiveCellPx: number): number {
  return viewportStartTime + (x / effectiveCellPx) * SECONDS_PER_CELL * 1000
}

export function yToPrice(y: number, logCenterPrice: number, canvasHeight: number, effectiveCellPx: number): number {
  const centerY = canvasHeight / 2
  return Math.exp(logCenterPrice - ((y - centerY) / effectiveCellPx) * LOG_STEP)
}