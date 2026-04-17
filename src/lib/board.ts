import type { StoneColor } from './types'

export type Vertex = [number, number]
export type Sign = -1 | 0 | 1
export type SignMap = Sign[][]

const SGF_OFFSET = 'a'.charCodeAt(0)

export function colorToSign(color: StoneColor): Sign {
  return color === 'B' ? 1 : -1
}

export function vertexToCoord(vertex: Vertex): string {
  return String.fromCharCode(SGF_OFFSET + vertex[0], SGF_OFFSET + vertex[1])
}

export function coordToVertex(coord: string): Vertex | null {
  if (coord.length !== 2) return null

  const x = coord.charCodeAt(0) - SGF_OFFSET
  const y = coord.charCodeAt(1) - SGF_OFFSET

  if (x < 0 || x > 18 || y < 0 || y > 18) return null
  return [x, y]
}

export function createEmptySignMap(size: number): SignMap {
  return Array.from({ length: size }, () => Array<Sign>(size).fill(0))
}

export function cloneSignMap(signMap: SignMap): SignMap {
  return signMap.map((row) => [...row])
}

export function createInitialSignMap(size: number, black: string[], white: string[]): SignMap {
  const signMap = createEmptySignMap(size)

  for (const coord of black) {
    const vertex = coordToVertex(coord)
    if (vertex) signMap[vertex[1]][vertex[0]] = 1
  }

  for (const coord of white) {
    const vertex = coordToVertex(coord)
    if (vertex) signMap[vertex[1]][vertex[0]] = -1
  }

  return signMap
}

export function applyMove(signMap: SignMap, color: StoneColor, coord: string | null): SignMap {
  const next = cloneSignMap(signMap)
  if (coord == null) return next

  const vertex = coordToVertex(coord)
  if (!vertex) return next

  const [x, y] = vertex
  const sign = colorToSign(color)
  if (next[y][x] !== 0) return next

  next[y][x] = sign

  for (const [nx, ny] of getNeighbors(vertex, next.length)) {
    if (next[ny][nx] === -sign) {
      const group = collectGroup(next, [nx, ny])
      if (group.liberties.size === 0) {
        removeGroup(next, group.vertices)
      }
    }
  }

  const ownGroup = collectGroup(next, vertex)
  if (ownGroup.liberties.size === 0) {
    removeGroup(next, ownGroup.vertices)
  }

  return next
}

function removeGroup(signMap: SignMap, vertices: Vertex[]): void {
  for (const [x, y] of vertices) {
    signMap[y][x] = 0
  }
}

function collectGroup(signMap: SignMap, start: Vertex): { vertices: Vertex[]; liberties: Set<string> } {
  const sign = signMap[start[1]][start[0]]
  if (sign === 0) return { vertices: [], liberties: new Set<string>() }

  const queue: Vertex[] = [start]
  const seen = new Set<string>()
  const vertices: Vertex[] = []
  const liberties = new Set<string>()

  while (queue.length > 0) {
    const current = queue.pop()!
    const key = `${current[0]}:${current[1]}`
    if (seen.has(key)) continue
    seen.add(key)
    vertices.push(current)

    for (const [nx, ny] of getNeighbors(current, signMap.length)) {
      const neighborSign = signMap[ny][nx]
      if (neighborSign === 0) {
        liberties.add(`${nx}:${ny}`)
      } else if (neighborSign === sign) {
        queue.push([nx, ny])
      }
    }
  }

  return { vertices, liberties }
}

function getNeighbors([x, y]: Vertex, size: number): Vertex[] {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ].filter((vertex): vertex is Vertex => vertex[0] >= 0 && vertex[0] < size && vertex[1] >= 0 && vertex[1] < size)
}
