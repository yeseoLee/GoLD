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
      white: 'Anime',
      black: 'Anime',
      'removal-graphic': 'square',
      'removal-scale': 1,
      'stone-shadows': 'anime',
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

export function GobanBoard({ problem, path, interactive = false, onPlay, revision }: GobanBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onPlayRef = useRef(onPlay)
  const [displayWidth, setDisplayWidth] = useState(720)

  onPlayRef.current = onPlay

  useEffect(() => {
    const element = containerRef.current
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

  useEffect(() => {
    configureGobanCallbacks()

    const element = containerRef.current
    if (!element) return

    element.replaceChildren()

    const goban = createGoban({
      board_div: element,
      interactive,
      mode: 'play',
      square_size: 'auto',
      display_width: displayWidth,
      draw_top_labels: true,
      draw_left_labels: true,
      draw_right_labels: true,
      draw_bottom_labels: true,
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
      one_click_submit: true,
      double_click_submit: false,
    }) as GobanRenderer

    const handlePlayedByClick = ({ x, y }: { x: number; y: number }) => {
      onPlayRef.current?.(vertexToCoord([x, y]))
    }

    goban.on('played-by-click', handlePlayedByClick)

    return () => {
      goban.destroy()
      element.replaceChildren()
    }
  }, [displayWidth, initialState, interactive, moves, problem.toPlay, problem.viewport.height, problem.viewport.left, problem.viewport.top, problem.viewport.width, revision])

  return (
    <div className="board-shell">
      <div className="board-engine" ref={containerRef} />
      <p className="board-caption">보드 엔진: online-go/goban (Apache-2.0), Anime stone 리소스 사용</p>
    </div>
  )
}
