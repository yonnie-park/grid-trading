import { SECONDS_PER_CELL } from '../lib/constants'
import { clamp } from '../lib/math'
import { logIndexToPriceRange } from './grid-math'
import type { ProbEngine } from './prob-engine'

const MIN_ODDS = 1.01
const MAX_ODDS = 100

export function calculateOdds(
  engine: ProbEngine,
  cellTimeIndex: number,
  cellPriceIndex: number,
  currentPrice: number,
  now: number
): number {
  if (!currentPrice || currentPrice <= 0) return MAX_ODDS

  const { low, high } = logIndexToPriceRange(cellPriceIndex)
  const cellMidTimeMs = cellTimeIndex * SECONDS_PER_CELL * 1000 + (SECONDS_PER_CELL * 1000) / 2
  const tauSec = Math.max(0, (cellMidTimeMs - now) / 1000)
  const pHit = engine.probHit(currentPrice, low, high, tauSec)
  return clamp(1 / pHit, MIN_ODDS, MAX_ODDS)
}