import { useState } from 'react'
import problemBundles from './generated/problems.json'
import { GobanBoard } from './components/GobanBoard'
import { buildSolutionPath, describeMove, getCurrentNode, getProblemTags, tryPlay } from './lib/game'
import type { FeedbackState, ProblemBundle, ProblemDifficulty } from './lib/types'

type Screen = 'list' | 'play' | 'solution'

type DifficultyFilter = ProblemDifficulty | 'all'

const problems = problemBundles as ProblemBundle[]

const difficultyLabels: Record<DifficultyFilter, string> = {
  all: '전체',
  beginner: '입문',
  easy: '초급',
  medium: '중급',
}

const feedbackLabels: Record<Exclude<FeedbackState['kind'], 'idle'>, string> = {
  correct: '수순 진행',
  wrong: '오답',
  solved: '해결 완료',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('list')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [activeProblemId, setActiveProblemId] = useState<string>(problems[0]?.id ?? '')
  const [path, setPath] = useState<string[]>(problems[0] ? [problems[0].rootNodeId] : [])
  const [solutionPath, setSolutionPath] = useState<string[]>(problems[0] ? buildSolutionPath(problems[0]) : [])
  const [solutionStep, setSolutionStep] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle' })

  const tags = getProblemTags(problems)
  const filteredProblems = problems.filter((problem) => {
    if (difficultyFilter !== 'all' && problem.difficulty !== difficultyFilter) return false
    if (tagFilter !== 'all' && !problem.tags.includes(tagFilter)) return false
    return true
  })

  const activeProblem = problems.find((problem) => problem.id === activeProblemId) ?? problems[0]
  const activeIndex = problems.findIndex((problem) => problem.id === activeProblem?.id)

  if (!activeProblem) {
    return <main className="app-shell">문제 데이터가 없습니다.</main>
  }

  const displayedPath = screen === 'solution' ? solutionPath.slice(0, solutionStep + 1) : path
  const currentNode = getCurrentNode(activeProblem, displayedPath)
  const rootNode = getCurrentNode(activeProblem, [activeProblem.rootNodeId])

  function openProblem(problem: ProblemBundle, nextScreen: Screen = 'play') {
    setActiveProblemId(problem.id)
    setPath([problem.rootNodeId])
    const nextSolutionPath = buildSolutionPath(problem)
    setSolutionPath(nextSolutionPath)
    setSolutionStep(0)
    setFeedback({ kind: 'idle' })
    setScreen(nextScreen)
  }

  function resetProblem() {
    setPath([activeProblem.rootNodeId])
    setFeedback({ kind: 'idle' })
    setScreen('play')
  }

  function moveProblem(offset: -1 | 1) {
    if (problems.length === 0 || activeIndex === -1) return
    const nextIndex = (activeIndex + offset + problems.length) % problems.length
    openProblem(problems[nextIndex], screen)
  }

  function handlePlay(move: string) {
    const result = tryPlay(activeProblem, path, move)
    setFeedback({
      kind: result.kind === 'wrong' ? 'wrong' : result.kind === 'solved' ? 'solved' : 'correct',
      message: result.message,
    })

    if (result.kind !== 'wrong') {
      setPath(result.path)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Go Life and Death</p>
          <h1>GoLD</h1>
          <p className="hero-copy">
            승인된 공개 출처를 기반으로 수집한 자료와 저장소 소유 SGF만 사용해, 사활 급소를 빠르게 읽는 정적 웹앱입니다.
          </p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{problems.length}</strong>
            <span>총 문제 수</span>
          </article>
          <article>
            <strong>{tags.length}</strong>
            <span>태그 종류</span>
          </article>
          <article>
            <strong>정적</strong>
            <span>백엔드 없이 실행</span>
          </article>
        </div>
      </section>

      {screen === 'list' && (
        <section className="list-screen">
          <div className="panel-header">
            <div>
              <p className="section-kicker">문제 목록</p>
              <h2>초급부터 중급까지 바로 풀이</h2>
            </div>
            <p className="section-copy">난이도와 태그로 좁힌 뒤 바로 들어가서 정답 수순만 연습할 수 있습니다.</p>
          </div>

          <div className="filter-grid">
            <div className="filter-block">
              <span>난이도</span>
              <div className="chip-row">
                {(['all', 'beginner', 'easy', 'medium'] as DifficultyFilter[]).map((filter) => (
                  <button
                    key={filter}
                    className={difficultyFilter === filter ? 'chip is-active' : 'chip'}
                    onClick={() => setDifficultyFilter(filter)}
                    type="button"
                  >
                    {difficultyLabels[filter]}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <span>태그</span>
              <div className="chip-row">
                <button className={tagFilter === 'all' ? 'chip is-active' : 'chip'} onClick={() => setTagFilter('all')} type="button">
                  전체
                </button>
                {tags.map((tag) => (
                  <button key={tag} className={tagFilter === tag ? 'chip is-active' : 'chip'} onClick={() => setTagFilter(tag)} type="button">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="problem-grid">
            {filteredProblems.map((problem) => (
              <article className="problem-card" key={problem.id}>
                <div className="problem-meta-row">
                  <span className="difficulty-pill">{difficultyLabels[problem.difficulty]}</span>
                  <span className="source-pill">{problem.sourceId}</span>
                </div>
                <h3>{problem.titleKo}</h3>
                <p className="problem-license">{problem.license}</p>
                <div className="tag-row">
                  {problem.tags.map((tag) => (
                    <span className="tag-pill" key={tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <button className="primary-button" onClick={() => openProblem(problem, 'play')} type="button">
                  {problem.titleKo} 시작
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {screen !== 'list' && (
        <section className="play-screen">
          <div className="toolbar">
            <button className="ghost-button" onClick={() => setScreen('list')} type="button">
              목록으로
            </button>
            <div className="toolbar-title">
              <p className="section-kicker">{screen === 'play' ? '문제 풀이' : '해답 재생'}</p>
              <h2>{activeProblem.titleKo}</h2>
            </div>
            <div className="toolbar-actions">
              <button className="ghost-button" onClick={() => moveProblem(-1)} type="button">
                이전 문제
              </button>
              <button className="ghost-button" onClick={() => moveProblem(1)} type="button">
                다음 문제
              </button>
            </div>
          </div>

          <div className="play-layout">
            <section className="board-panel">
              <GobanBoard interactive={screen === 'play'} onPlay={handlePlay} path={displayedPath} problem={activeProblem} />
              {screen === 'play' && (
                <div className="board-actions">
                  <button className="ghost-button" onClick={resetProblem} type="button">
                    초기화
                  </button>
                  <button className="primary-button" onClick={() => setScreen('solution')} type="button">
                    해답 보기
                  </button>
                </div>
              )}
              {screen === 'solution' && (
                <div className="board-actions solution-actions">
                  <button className="ghost-button" disabled={solutionStep === 0} onClick={() => setSolutionStep((step) => Math.max(0, step - 1))} type="button">
                    이전 수
                  </button>
                  <span className="solution-counter">
                    수순 {solutionStep} / {Math.max(0, solutionPath.length - 1)}
                  </span>
                  <button
                    className="ghost-button"
                    disabled={solutionStep >= solutionPath.length - 1}
                    onClick={() => setSolutionStep((step) => Math.min(solutionPath.length - 1, step + 1))}
                    type="button"
                  >
                    다음 수
                  </button>
                </div>
              )}
            </section>

            <aside className="side-panel">
              <article className="info-card">
                <p className="section-kicker">문제 정보</p>
                <h3>{rootNode.comment ?? activeProblem.titleKo}</h3>
                <div className="meta-stack">
                  <span>난이도: {difficultyLabels[activeProblem.difficulty]}</span>
                  <span>출처: {activeProblem.sourceUrl}</span>
                  <span>라이선스: {activeProblem.license}</span>
                </div>
              </article>

              {feedback.kind !== 'idle' && screen === 'play' && (
                <article className={`feedback-card is-${feedback.kind}`}>
                  <strong>{feedbackLabels[feedback.kind]}</strong>
                  <p>{feedback.message}</p>
                </article>
              )}

              <article className="info-card">
                <p className="section-kicker">현재 상태</p>
                <h3>{currentNode.comment ?? '수를 읽어 보세요.'}</h3>
                <div className="meta-stack">
                  <span>마지막 수: {describeMove(currentNode.move)}</span>
                  <span>태그: {activeProblem.tags.join(', ')}</span>
                  <span>판 크기: {activeProblem.boardSize}x{activeProblem.boardSize}</span>
                </div>
              </article>
            </aside>
          </div>
        </section>
      )}
    </main>
  )
}
