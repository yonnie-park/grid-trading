import { useCallback, useRef } from 'react'
import { CELL_PX, LOG_STEP, SECONDS_PER_CELL, VIEWPORT_ANCHOR_RATIO, ZOOM_MIN, ZOOM_MAX } from '../lib/constants'
import type { Viewport } from '../types'

export function useViewport() {
  const offsetMsRef = useRef(0)
  const logCenterRef = useRef<number | null>(null)
  const scaleRef = useRef(1)

  const viewportRef = useRef<Viewport>({
    startTime: Date.now() - 120_000,
    endTime: Date.now() + 40_000,
    logCenterPrice: Math.log(97000),
    scale: 1,
    effectiveCellPx: CELL_PX,
  })

  const updateViewport = useCallback((now: number, currentPrice: number, canvasWidth: number) => {
    if (logCenterRef.current === null) logCenterRef.current = Math.log(currentPrice)
    const scale = scaleRef.current
    const effectiveCellPx = CELL_PX * scale
    const visibleMs = (canvasWidth / effectiveCellPx) * SECONDS_PER_CELL * 1000
    const startTime = now - visibleMs * VIEWPORT_ANCHOR_RATIO + offsetMsRef.current
    viewportRef.current = {
      startTime,
      endTime: startTime + visibleMs,
      logCenterPrice: logCenterRef.current,
      scale,
      effectiveCellPx,
    }
  }, [])

  const pan = useCallback((dxPx: number, dyPx: number) => {
    const effectiveCellPx = CELL_PX * scaleRef.current
    offsetMsRef.current -= (dxPx / (effectiveCellPx / SECONDS_PER_CELL)) * 1000
    if (logCenterRef.current !== null) {
      logCenterRef.current += (dyPx / effectiveCellPx) * LOG_STEP
    }
  }, [])

  const zoom = useCallback((factor: number, pivotX: number, canvasWidth: number) => {
    const oldScale = scaleRef.current
    const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * factor))
    if (newScale === oldScale) return
    const oldEff = CELL_PX * oldScale
    const newEff = CELL_PX * newScale
    const pivotRatio = pivotX / canvasWidth
    const oldMs = (canvasWidth / oldEff) * SECONDS_PER_CELL * 1000
    const newMs = (canvasWidth / newEff) * SECONDS_PER_CELL * 1000
    offsetMsRef.current += (newMs - oldMs) * (VIEWPORT_ANCHOR_RATIO - pivotRatio)
    scaleRef.current = newScale
  }, [])

  return { viewportRef, updateViewport, pan, zoom }
}
