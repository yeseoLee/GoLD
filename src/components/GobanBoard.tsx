import { useEffect, useRef, useState } from 'react'
import { BoundedGoban as RawBoundedGoban } from '@sabaki/shudan/src/main.js'
import type { BoundedGobanProps, Marker } from '@sabaki/shudan/src/main.js'
import { coordToVertex, vertexToCoord } from '../lib/board'
import { buildBoardState, getLastMove } from '../lib/game'
import type { ProblemBundle } from '../lib/types'

const BoundedGoban = RawBoundedGoban as unknown as React.ComponentType<BoundedGobanProps>

interface GobanBoardProps {
  problem: ProblemBundle
  path: string[]
  interactive?: boolean
  onPlay?: (move: string) => void
}

export function GobanBoard({ problem, path, interactive = false, onPlay }: GobanBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState(560)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const nextSize = Math.max(280, Math.floor(element.clientWidth))
      setSize(nextSize)
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const signMap = buildBoardState(problem, path)
  const markerMap = buildMarkerMap(problem.boardSize, getLastMove(problem, path))

  return (
    <div className="board-shell" ref={containerRef}>
      <BoundedGoban
        maxWidth={size}
        maxHeight={size}
        maxVertexSize={58}
        rangeX={[problem.viewport.left, problem.viewport.left + problem.viewport.width - 1]}
        rangeY={[problem.viewport.top, problem.viewport.top + problem.viewport.height - 1]}
        signMap={signMap}
        markerMap={markerMap}
        animateStonePlacement
        fuzzyStonePlacement
        showCoordinates
        onVertexClick={
          interactive && onPlay
            ? (_event, vertex) => {
                onPlay(vertexToCoord(vertex))
              }
            : undefined
        }
      />
    </div>
  )
}

function buildMarkerMap(boardSize: number, move: string | null) {
  const markerMap = Array.from({ length: boardSize }, () => Array<Marker | null>(boardSize).fill(null))
  if (!move) return markerMap

  const vertex = coordToVertex(move)
  if (vertex) {
    markerMap[vertex[1]][vertex[0]] = { type: 'point' }
  }

  return markerMap
}
