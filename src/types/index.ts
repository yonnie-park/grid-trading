export interface PricePoint {
  timestamp: number
  price: number
}

export interface Viewport {
  startTime: number
  endTime: number
  logCenterPrice: number
  scale: number
  effectiveCellPx: number
}

export interface CanvasDimensions {
  width: number
  height: number
  dpr: number
}

export type CellState = 'bettable' | 'locked' | 'present' | 'past'

export interface CellCoord {
  timeIndex: number
  priceIndex: number
}

export type BetStatus = 'active' | 'won' | 'lost' | 'expired'

export interface Bet {
  id: string
  cellTimeIndex: number
  cellPriceIndex: number
  odds: number
  amount: number
  status: BetStatus
  createdAt: number
  resolvedAt: number | null
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
