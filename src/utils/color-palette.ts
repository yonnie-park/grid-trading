import type { CellState, BetStatus } from '../types'

const CELL_STATE_COLORS: Record<CellState, string> = {
  bettable: 'rgba(173, 255, 47, 0.04)',
  locked:   'rgba(255, 107, 107, 0.05)',
  present:  'rgba(255, 255, 255, 0.04)',
  past:     'rgba(0, 0, 0, 0)',
}

const BET_STATUS_COLORS: Record<BetStatus, string> = {
  active:  'rgba(173, 255, 47, 0.12)',
  won:     'rgba(173, 255, 47, 0.18)',
  lost:    'rgba(255, 107, 107, 0.12)',
  expired: 'rgba(80, 80, 80, 0.1)',
}

const BET_BORDER_COLORS: Record<BetStatus, string> = {
  active:  '#ADFF2F',
  won:     '#ADFF2F',
  lost:    '#FF6B6B',
  expired: 'rgba(80, 80, 80, 0.3)',
}

export const GRID_LINE_COLOR        = 'rgba(30, 30, 30, 0.9)'
export const GRID_LINE_MAJOR_COLOR  = 'rgba(50, 50, 50, 0.95)'
export const PRICE_LINE_COLOR       = 'rgba(160, 160, 160, 0.85)'
export const CURRENT_PRICE_LINE_COLOR = 'rgba(100, 100, 100, 0.6)'
export const CROSSHAIR_COLOR        = 'rgba(100, 100, 100, 0.35)'
export const HOVER_CELL_COLOR       = 'rgba(255, 255, 255, 0.04)'
export const AXIS_BG_COLOR          = 'rgba(7, 7, 7, 0.92)'
export const AXIS_TEXT_COLOR        = 'rgba(255, 255, 255, 0.5)'
export const AXIS_TAG_BG            = 'rgba(30, 30, 30, 0.98)'
export const AXIS_TAG_TEXT          = '#ffffff'

export const getCellStateColor = (state: CellState) => CELL_STATE_COLORS[state]
export const getBetStatusColor = (status: BetStatus) => BET_STATUS_COLORS[status]
export const getBetBorderColor = (status: BetStatus) => BET_BORDER_COLORS[status]