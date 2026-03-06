import { useCallback, useEffect, useRef, useState } from 'react'
import { RingBuffer } from '../lib/ring-buffer'
import { DEFAULT_BET_AMOUNT } from '../lib/constants'
import { getCellState, timeIndexToTimeRange, logIndexToPriceRange } from '../utils/grid-math'
import { calculateOdds } from '../utils/odds-calculator'
import { ProbEngine } from '../utils/prob-engine'
import type { Bet, CellCoord, PricePoint } from '../types'

export function useBettingEngine(
  bufferRef: React.RefObject<RingBuffer<PricePoint>>,
  currentPrice: number | null
) {
  const [bets, setBets] = useState<Bet[]>([])
  const [balance, setBalance] = useState(10_000)
  const [wonIds, setWonIds] = useState<Set<string>>(new Set())
  const betsRef = useRef<Bet[]>([])
  const engineRef = useRef(new ProbEngine())
  const currentPriceRef = useRef<number | null>(null)

  // Feed new prices into the prob engine
  useEffect(() => {
    if (currentPrice === null) return
    currentPriceRef.current = currentPrice
    engineRef.current.updatePrice(currentPrice)
  }, [currentPrice])

  const getOdds = useCallback((ti: number, pi: number): number | null => {
    const price = currentPriceRef.current
    if (!price) return null
    if (getCellState(ti, Date.now()) !== 'bettable') return null
    return calculateOdds(engineRef.current, ti, pi, price, Date.now())
  }, [])

  const placeBet = useCallback((cell: CellCoord, betAmount: number = 100) => {
    const now = Date.now()
    const price = currentPriceRef.current
    if (!price || getCellState(cell.timeIndex, now) !== 'bettable') return
    const alreadyBet = betsRef.current.some(
      b => b.status === 'active' && b.cellTimeIndex === cell.timeIndex && b.cellPriceIndex === cell.priceIndex
    )
    if (alreadyBet) return
    const odds = calculateOdds(engineRef.current, cell.timeIndex, cell.priceIndex, price, now)

    const bet: Bet = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      cellTimeIndex: cell.timeIndex,
      cellPriceIndex: cell.priceIndex,
      odds,
      amount: betAmount,
      status: 'active',
      createdAt: now,
      resolvedAt: null,
    }
    setBalance(b => b - betAmount)
    setBets(prev => {
      const next = [...prev, bet]
      betsRef.current = next
      return next
    })
  }, [])

  // Poll every 500ms to resolve bets whose cells are past
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setBets(prev => {
        let changed = false
        const newlyWon: string[] = []

        const next = prev.map(bet => {
          if (bet.status !== 'active') return bet
          if (getCellState(bet.cellTimeIndex, now) !== 'past') return bet

          changed = true
          const range = timeIndexToTimeRange(bet.cellTimeIndex)
          const priceRange = logIndexToPriceRange(bet.cellPriceIndex)
          const buffer = bufferRef.current
          let hit = false
          for (let i = 0; i < buffer.size; i++) {
            const p = buffer.get(i)
            if (!p) continue
            if (p.timestamp >= range.start && p.timestamp <= range.end) {
              if (p.price >= priceRange.low && p.price <= priceRange.high) {
                hit = true; break
              }
            }
          }

          if (hit) {
            setBalance(b => b + bet.amount * bet.odds)
            newlyWon.push(bet.id)
            return { ...bet, status: 'won' as const, resolvedAt: now }
          }
          return { ...bet, status: 'lost' as const, resolvedAt: now }
        })

        if (newlyWon.length > 0) {
          setWonIds(ids => {
            const next = new Set(ids)
            newlyWon.forEach(id => next.add(id))
            return next
          })
        }

        if (changed) { betsRef.current = next; return next }
        return prev
      })
    }, 500)
    return () => clearInterval(interval)
  }, [bufferRef])

  const clearWonId = useCallback((id: string) => {
    setWonIds(ids => { const next = new Set(ids); next.delete(id); return next })
  }, [])


  const clearResolved = useCallback(() => {
    setBets(prev => {
      const next = prev.filter(b => b.status === 'active')
      betsRef.current = next
      return next
    })
  }, [])

  return { bets, betsRef, balance, placeBet, getOdds, clearResolved, wonIds, clearWonId }
}