import compiledProblems from '../generated/problems.json'
import { buildBoardState, tryPlay } from './game'
import type { ProblemBundle } from './types'

const problems = compiledProblems as ProblemBundle[]

describe('problem game flow', () => {
  it('keeps the board unchanged on a commented wrong attempt', () => {
    const problem = problems.find((entry) => entry.id === 'life_problem_0030')!
    const path = [problem.rootNodeId]
    const before = buildBoardState(problem, path)

    const result = tryPlay(problem, path, 'cs')

    expect(result.kind).toBe('wrong')
    expect(result.message).toContain('Wrong move')
    expect(buildBoardState(problem, result.path)).toEqual(before)
  })

  it('applies the correct move and auto response from the imported dataset', () => {
    const problem = problems.find((entry) => entry.id === 'life_problem_0035')!
    const path = [problem.rootNodeId]

    const result = tryPlay(problem, path, 'bs')

    expect(result.kind).toBe('advanced')
    expect(result.path).toHaveLength(3)
  })
})
