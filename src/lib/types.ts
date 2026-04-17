export type StoneColor = 'B' | 'W'
export type ProblemDifficulty = 'beginner' | 'easy' | 'medium'
export type ProblemVerdict = 'correct' | 'wrong' | 'neutral'

export interface SourceAsset {
  id: string
  url: string
  filename: string
}

export interface SourceRegistryEntry {
  id: string
  name: string
  sourceUrl: string
  license: string
  evidenceUrl: string
  notes: string
  assets?: SourceAsset[]
}

export interface ProblemCatalogEntry {
  id: string
  slug: string
  titleKo: string
  difficulty: ProblemDifficulty
  tags: string[]
  sourceId: string
  sourceUrl: string
  license: string
  boardSize: 19
  toPlay: StoneColor
}

export interface ProblemViewport {
  top: number
  left: number
  width: number
  height: number
}

export interface CompiledProblemNode {
  id: string
  move: string | null
  player: StoneColor | null
  verdict: ProblemVerdict
  comment?: string
  autoPlay: boolean
  children: string[]
}

export interface CompiledProblem {
  initialStones: { black: string[]; white: string[] }
  viewport: ProblemViewport
  rootNodeId: string
  nodes: CompiledProblemNode[]
}

export type ProblemBundle = ProblemCatalogEntry & CompiledProblem

export interface AttemptResult {
  kind: 'advanced' | 'wrong' | 'solved'
  message?: string
  path: string[]
}

export interface FeedbackState {
  kind: 'idle' | 'correct' | 'wrong' | 'solved'
  message?: string
}
