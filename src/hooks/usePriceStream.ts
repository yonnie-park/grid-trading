import { useCallback, useEffect, useRef, useState } from 'react'
import { RingBuffer } from '../lib/ring-buffer'
import { PRICE_BUFFER_CAPACITY, THROTTLE_UI_MS, WS_RECONNECT_BASE_MS, WS_RECONNECT_MAX_MS } from '../lib/constants'
import type { PricePoint, ConnectionStatus } from '../types'

function useBinanceStream(onPrice: (p: PricePoint) => void, onStatus: (s: ConnectionStatus) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onPriceRef = useRef(onPrice)
  const onStatusRef = useRef(onStatus)
  onPriceRef.current = onPrice
  onStatusRef.current = onStatus

  useEffect(() => {
    function connect() {
      onStatusRef.current('connecting')
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade')
      wsRef.current = ws

      ws.onopen = () => { retryRef.current = 0; onStatusRef.current('connected') }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          onPriceRef.current({ timestamp: data.T, price: parseFloat(data.p) })
        } catch {}
      }

      ws.onerror = () => onStatusRef.current('error')

      ws.onclose = () => {
        onStatusRef.current('disconnected')
        const delay = Math.min(WS_RECONNECT_BASE_MS * 2 ** retryRef.current, WS_RECONNECT_MAX_MS)
        retryRef.current++
        timerRef.current = setTimeout(connect, delay)
      }
    }

    connect()
    return () => {
      wsRef.current?.close()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}

function useMockStream(onPrice: (p: PricePoint) => void, onStatus: (s: ConnectionStatus) => void) {
  const onPriceRef = useRef(onPrice)
  onPriceRef.current = onPrice

  useEffect(() => {
    onStatus('connected')
    let price = 97000
    const interval = setInterval(() => {
      price += (Math.random() - 0.5) * 20
      onPriceRef.current({ timestamp: Date.now(), price })
    }, 500)
    return () => clearInterval(interval)
  }, [onStatus])
}

export function usePriceStream(mode: 'binance' | 'mock') {
  const bufferRef = useRef(new RingBuffer<PricePoint>(PRICE_BUFFER_CAPACITY))
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const lastUiRef = useRef(0)

  const onPrice = useCallback((p: PricePoint) => {
    bufferRef.current.push(p)
    const now = Date.now()
    if (now - lastUiRef.current >= THROTTLE_UI_MS) {
      lastUiRef.current = now
      setCurrentPrice(p.price)
    }
  }, [])

  const onStatus = useCallback((s: ConnectionStatus) => setStatus(s), [])

  if (mode === 'binance') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useBinanceStream(onPrice, onStatus)
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMockStream(onPrice, onStatus)
  }

  return { bufferRef, currentPrice, status }
}
