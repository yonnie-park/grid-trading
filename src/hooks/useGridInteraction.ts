import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { pixelToCellCoord, getCellState } from '../utils/grid-math'
import type { Viewport, CanvasDimensions, CellCoord } from '../types'
import type { CursorState } from '../renderers/cursor-renderer'

const DRAG_THRESHOLD = 3

export function useGridInteraction(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  viewportRef: RefObject<Viewport>,
  dimensionsRef: RefObject<CanvasDimensions>,
  onCellClick: (cell: CellCoord) => void,
  pan: (dx: number, dy: number) => void,
  zoom: (factor: number, pivotX: number, canvasWidth: number) => void,
) {
  const cursorRef = useRef<CursorState>({ mouseX: -1, mouseY: -1, hoveredCell: null })
  const draggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastDragRef = useRef({ x: 0, y: 0 })
  const dragDistRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const coords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current?.getBoundingClientRect()
    if (!r) return null
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }, [canvasRef])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = coords(e); if (!c) return
    draggingRef.current = true
    dragStartRef.current = c
    lastDragRef.current = c
    dragDistRef.current = 0
    setIsDragging(true)
  }, [coords])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = coords(e); if (!c) return
    if (draggingRef.current) {
      const dx = c.x - lastDragRef.current.x
      const dy = c.y - lastDragRef.current.y
      lastDragRef.current = c
      dragDistRef.current += Math.abs(dx) + Math.abs(dy)
      pan(dx, dy)
      return
    }
    const vp = viewportRef.current
    const d = dimensionsRef.current
    const cell = pixelToCellCoord(c.x, c.y, vp.startTime, vp.logCenterPrice, d.height - 24, vp.effectiveCellPx)
    cursorRef.current = { mouseX: c.x, mouseY: c.y, hoveredCell: cell }
  }, [coords, pan, viewportRef, dimensionsRef])

  const handleMouseUp = useCallback(() => { draggingRef.current = false; setIsDragging(false) }, [])

  const handleMouseLeave = useCallback(() => {
    draggingRef.current = false
    setIsDragging(false)
    cursorRef.current = { mouseX: -1, mouseY: -1, hoveredCell: null }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragDistRef.current > DRAG_THRESHOLD) return
    const c = coords(e); if (!c) return
    const vp = viewportRef.current
    const d = dimensionsRef.current
    const cell = pixelToCellCoord(c.x, c.y, vp.startTime, vp.logCenterPrice, d.height - 24, vp.effectiveCellPx)
    if (getCellState(cell.timeIndex, Date.now()) === 'bettable') onCellClick(cell)
  }, [coords, viewportRef, dimensionsRef, onCellClick])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { pan(-e.deltaX, 0); return }
    const r = canvas.getBoundingClientRect()
    zoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX - r.left, dimensionsRef.current.width)
  }, [canvasRef, pan, zoom, dimensionsRef])

  return { cursorRef, isDragging, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleClick, handleWheel }
}
