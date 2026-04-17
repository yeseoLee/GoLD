import { applyMove, createInitialSignMap } from './board'
import type { AttemptResult, CompiledProblemNode, ProblemBundle } from './types'

type Problem = ProblemBundle

function createNodeIndex(problem: Problem): Map<string, CompiledProblemNode> {
  return new Map(problem.nodes.map((node) => [node.id, node]))
}

export function getNode(problem: Problem, nodeId: string): CompiledProblemNode {
  const node = createNodeIndex(problem).get(nodeId)
  if (!node) {
    throw new Error(`Unknown node id: ${nodeId}`)
  }

  return node
}

export function getCurrentNode(problem: Problem, path: string[]): CompiledProblemNode {
  const nodeId = path[path.length - 1] ?? problem.rootNodeId
  return getNode(problem, nodeId)
}

export function buildBoardState(problem: Problem, path: string[]) {
  let signMap = createInitialSignMap(problem.boardSize, problem.initialStones.black, problem.initialStones.white)
  const nodeIndex = createNodeIndex(problem)

  for (const nodeId of path.slice(1)) {
    const node = nodeIndex.get(nodeId)
    if (node?.player) {
      signMap = applyMove(signMap, node.player, node.move)
    }
  }

  return signMap
}

export function getLastMove(problem: Problem, path: string[]): string | null {
  const nodeIndex = createNodeIndex(problem)

  for (const nodeId of [...path].reverse()) {
    const node = nodeIndex.get(nodeId)
    if (node?.move) return node.move
  }

  return null
}

export function tryPlay(problem: Problem, path: string[], move: string): AttemptResult {
  const nodeIndex = createNodeIndex(problem)
  const currentNode = getCurrentNode(problem, path)
  const children = currentNode.children.map((childId) => nodeIndex.get(childId)).filter(Boolean) as CompiledProblemNode[]

  const matched = children.find((child) => !child.autoPlay && child.move === move)
  if (!matched) {
    return {
      kind: 'wrong',
      path,
      message: '그 수는 이 문제의 정답 수순에 없습니다.',
    }
  }

  if (matched.verdict === 'wrong') {
    return {
      kind: 'wrong',
      path,
      message: matched.comment ?? '오답입니다. 다른 급소를 찾아보세요.',
    }
  }

  const nextPath = consumeAutoPath(problem, [...path, matched.id])
  const settledNode = getCurrentNode(problem, nextPath)
  const followUps = settledNode.children
    .map((childId) => nodeIndex.get(childId))
    .filter((child): child is CompiledProblemNode => Boolean(child))
    .filter((child) => !child.autoPlay && child.verdict !== 'wrong')

  return {
    kind: followUps.length === 0 ? 'solved' : 'advanced',
    path: nextPath,
    message:
      settledNode.comment ??
      matched.comment ??
      (followUps.length === 0 ? '정답입니다.' : '좋습니다. 다음 수를 이어 가세요.'),
  }
}

function consumeAutoPath(problem: Problem, path: string[]): string[] {
  const nodeIndex = createNodeIndex(problem)
  const nextPath = [...path]

  while (true) {
    const currentNode = getCurrentNode(problem, nextPath)
    const autoChildren = currentNode.children
      .map((childId) => nodeIndex.get(childId))
      .filter((child): child is CompiledProblemNode => Boolean(child))
      .filter((child) => child.autoPlay && child.verdict !== 'wrong')

    if (autoChildren.length !== 1) break
    nextPath.push(autoChildren[0].id)
  }

  return nextPath
}

export function buildSolutionPath(problem: Problem): string[] {
  const nodeIndex = createNodeIndex(problem)
  const path = [problem.rootNodeId]

  while (true) {
    const currentNode = getCurrentNode(problem, path)
    const nextNode = currentNode.children
      .map((childId) => nodeIndex.get(childId))
      .filter((child): child is CompiledProblemNode => Boolean(child))
      .find((child) => child.verdict !== 'wrong')

    if (!nextNode) break
    path.push(nextNode.id)
  }

  return path
}

export function getProblemTags(problems: ProblemBundle[]): string[] {
  return Array.from(new Set(problems.flatMap((problem) => problem.tags))).sort((left, right) => left.localeCompare(right, 'ko'))
}

export function describeMove(move: string | null): string {
  if (!move) return '패스'
  return move.toUpperCase()
}
