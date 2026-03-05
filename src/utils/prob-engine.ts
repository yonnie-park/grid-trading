import { SECONDS_PER_CELL } from '../lib/constants'
import { clamp, normalCdf } from '../lib/math'

const DEFAULT_LAMBDA = 0.9981819657682716
const DEFAULT_KAPPA = 1.2487844586767025
const DEFAULT_INIT_SIGMA2 = 1e-9
const MIN_SIGMA2 = 1e-18
const MIN_PROB = 1e-12
const PRICE_UPDATE_INTERVAL_SEC = 0.25

export class ProbEngine {
  private lambda: number
  private kappa: number
  private sigma2: number
  private prevLogPrice: number | null = null

  constructor(params?: { lambda?: number; kappa?: number; initSigma2?: number }) {
    this.lambda = params?.lambda ?? DEFAULT_LAMBDA
    this.kappa = params?.kappa ?? DEFAULT_KAPPA
    this.sigma2 = Math.max(params?.initSigma2 ?? DEFAULT_INIT_SIGMA2, MIN_SIGMA2)
  }

  updatePrice(price: number): void {
    const lp = Math.log(price)
    if (this.prevLogPrice !== null) {
      const r = lp - this.prevLogPrice
      this.sigma2 = this.lambda * this.sigma2 + (1 - this.lambda) * r * r
      if (this.sigma2 < MIN_SIGMA2) this.sigma2 = MIN_SIGMA2
    }
    this.prevLogPrice = lp
  }

  probHit(currentPrice: number, cellLow: number, cellHigh: number, tauSec: number): number {
    if (tauSec <= 0) {
      return currentPrice >= cellLow && currentPrice < cellHigh ? 1 : MIN_PROB
    }
    const dt = PRICE_UPDATE_INTERVAL_SEC
    const n = Math.ceil(SECONDS_PER_CELL / dt)
    const cellStartTau = tauSec - SECONDS_PER_CELL / 2
    let pMiss = 1
    for (let i = 0; i < n; i++) {
      const tauI = cellStartTau + (i + 0.5) * dt
      if (tauI <= 0) continue
      const V = this.kappa * this.sigma2 * tauI
      const sqrtV = Math.sqrt(Math.max(V, MIN_SIGMA2))
      const zHigh = Math.log(cellHigh / currentPrice) / sqrtV
      const zLow  = Math.log(cellLow  / currentPrice) / sqrtV
      const pHitI = normalCdf(zHigh) - normalCdf(zLow)
      pMiss *= 1 - clamp(pHitI, 0, 1)
    }
    return clamp(1 - pMiss, MIN_PROB, 1 - MIN_PROB)
  }

  getSigma2(): number { return this.sigma2 }
}