import compiledProblems from '../generated/problems.json'
import { buildBoardState, tryPlay } from './game'
import type { ProblemBundle } from './types'

const problems = compiledProblems as ProblemBundle[]

describe('problem game flow', () => {
  it('keeps the board unchanged on a wrong attempt', () => {
    const problem = problems.find((entry) => entry.id === 'corner-capture-1')!
    const path = [problem.rootNodeId]
    const before = buildBoardState(problem, path)

    const result = tryPlay(problem, path, 'cb')

    expect(result.kind).toBe('wrong')
    expect(result.message).toContain('오답')
    expect(buildBoardState(problem, result.path)).toEqual(before)
  })

  it('applies the correct move and auto response before waiting for the next move', () => {
    const problem = problems.find((entry) => entry.id === 'edge-throw-in-1')!
    const path = [problem.rootNodeId]

    const result = tryPlay(problem, path, 'fe')

    expect(result.kind).toBe('advanced')
    expect(result.path).toHaveLength(3)
  })
})
