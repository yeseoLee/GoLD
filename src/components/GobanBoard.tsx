import { useEffect, useMemo, useRef, useState } from 'react'
import { createGoban, Goban, JGOFNumericPlayerColor, setGobanRenderer, type GobanRenderer, type JGOFMove } from 'goban'
import { coordToVertex, vertexToCoord } from '../lib/board'
import { getNode } from '../lib/game'
import type { ProblemBundle } from '../lib/types'

let callbacksConfigured = false

function configureGobanCallbacks() {
  if (callbacksConfigured) return

  setGobanRenderer('canvas')
  Goban.setCallbacks({
    getCoordinateDisplaySystem: () => 'A1',
    getCDNReleaseBase: () => '',
    getSelectedThemes: () => ({
      board: 'Plain',
      white: 'Plain',
      black: 'Plain',
      'removal-graphic': 'square',
      'removal-scale': 1,
      'stone-shadows': 'default',
    }),
  })

  callbacksConfigured = true
}

interface GobanBoardProps {
  problem: ProblemBundle
  path: string[]
  interactive?: boolean
  onPlay?: (move: string) => void
  revision: number
}

interface BoardMetrics {
  width: number
  height: number
  squareSize: number
  leftLabel: number
  rightLabel: number
  topLabel: number
  bottomLabel: number
  ox: number
  oy: number
  mid: number
}

export function GobanBoard({ problem, path, interactive = false, onPlay, revision }: GobanBoardProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const gobanRef = useRef<HTMLDivElement | null>(null)
  const onPlayRef = useRef(onPlay)
  const [displayWidth, setDisplayWidth] = useState(720)

  onPlayRef.current = onPlay

  useEffect(() => {
    const element = frameRef.current
    if (!element) return

    const updateSize = () => {
      const nextSize = Math.max(320, Math.floor(element.clientWidth))
      setDisplayWidth(nextSize)
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const moves = useMemo<JGOFMove[]>(() => {
    return path
      .slice(1)
      .map((nodeId) => {
        const node = getNode(problem, nodeId)
        if (!node.player || !node.move) return null

        const vertex = coordToVertex(node.move)
        if (!vertex) return null

        return {
          x: vertex[0],
          y: vertex[1],
          color: node.player === 'B' ? JGOFNumericPlayerColor.BLACK : JGOFNumericPlayerColor.WHITE,
        }
      })
      .filter((move): move is JGOFMove => Boolean(move))
  }, [path, problem])

  const initialState = useMemo(
    () => ({
      black: problem.initialStones.black.join(''),
      white: problem.initialStones.white.join(''),
    }),
    [problem.initialStones.black, problem.initialStones.white],
  )

  const metrics = useMemo(() => {
    return getBoardMetrics(problem, displayWidth)
  }, [displayWidth, problem])

  const overlayIntersections = useMemo(() => {
    const intersections = [] as Array<{ key: string; coord: string; left: number; top: number }>
    const right = problem.viewport.left + problem.viewport.width - 1
    const bottom = problem.viewport.top + problem.viewport.height - 1

    for (let y = problem.viewport.top; y <= bottom; y += 1) {
      for (let x = problem.viewport.left; x <= right; x += 1) {
        const coord = vertexToCoord([x, y])
        intersections.push({
          key: coord,
          coord,
          left: x * metrics.squareSize + metrics.ox + metrics.mid,
          top: y * metrics.squareSize + metrics.oy + metrics.mid,
        })
      }
    }

    return intersections
  }, [metrics, problem])

  useEffect(() => {
    configureGobanCallbacks()

    const element = gobanRef.current
    if (!element) return

    element.replaceChildren()

    const goban = createGoban({
      board_div: element,
      interactive: false,
      mode: 'play',
      square_size: metrics.squareSize,
      display_width: displayWidth,
      draw_top_labels: metrics.topLabel === 1,
      draw_left_labels: metrics.leftLabel === 1,
      draw_right_labels: metrics.rightLabel === 1,
      draw_bottom_labels: metrics.bottomLabel === 1,
      bounds: {
        left: problem.viewport.left,
        right: problem.viewport.left + problem.viewport.width - 1,
        top: problem.viewport.top,
        bottom: problem.viewport.top + problem.viewport.height - 1,
      },
      initial_state: initialState,
      moves,
      player_id: problem.toPlay === 'B' ? 1 : 2,
      black_player_id: 1,
      white_player_id: 2,
      dont_show_messages: true,
      dont_draw_last_move: false,
    }) as GobanRenderer

    return () => {
      goban.destroy()
      element.replaceChildren()
    }
  }, [displayWidth, initialState, metrics.bottomLabel, metrics.leftLabel, metrics.rightLabel, metrics.squareSize, metrics.topLabel, moves, problem.toPlay, problem.viewport.height, problem.viewport.left, problem.viewport.top, problem.viewport.width, revision])

  return (
    <div className="board-shell">
      <div className="board-frame" ref={frameRef}>
        <div className="board-stage" style={{ width: metrics.width, height: metrics.height }}>
          <div className="board-surface" ref={gobanRef} />
          {interactive && (
            <div className="board-overlay" style={{ width: metrics.width, height: metrics.height }}>
              {overlayIntersections.map((intersection) => (
                <button
                  aria-label={`play-${intersection.coord}`}
                  className="board-hitbox"
                  key={intersection.key}
                  onClick={() => onPlayRef.current?.(intersection.coord)}
                  style={{
                    left: `${intersection.left}px`,
                    top: `${intersection.top}px`,
                    width: `${Math.max(20, metrics.squareSize * 0.86)}px`,
                    height: `${Math.max(20, metrics.squareSize * 0.86)}px`,
                  }}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="board-caption">보드 엔진: online-go/goban (Apache-2.0), Plain stone 테마 사용</p>
    </div>
  )
}

function getBoardMetrics(problem: ProblemBundle, displayWidth: number): BoardMetrics {
  const left = problem.viewport.left
  const top = problem.viewport.top
  const width = problem.viewport.width
  const height = problem.viewport.height
  const right = left + width - 1
  const bottom = top + height - 1

  const leftLabel = left === 0 ? 1 : 0
  const rightLabel = right === problem.boardSize - 1 ? 1 : 0
  const topLabel = top === 0 ? 1 : 0
  const bottomLabel = bottom === problem.boardSize - 1 ? 1 : 0

  const nSquares = Math.max(width + leftLabel + rightLabel, height + topLabel + bottomLabel)
  const squareSize = Math.max(24, Math.floor(displayWidth / nSquares))
  const mid = squareSize % 2 === 0 ? squareSize / 2 - 0.5 : squareSize / 2
  const ox = left > 0 ? -squareSize * left : leftLabel * squareSize
  const oy = top > 0 ? -squareSize * top : topLabel * squareSize

  return {
    width: squareSize * (width + leftLabel + rightLabel),
    height: squareSize * (height + topLabel + bottomLabel),
    squareSize,
    leftLabel,
    rightLabel,
    topLabel,
    bottomLabel,
    ox,
    oy,
    mid,
  }
}
