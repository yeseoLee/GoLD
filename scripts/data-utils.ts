import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sgf from '@sabaki/sgf'
import type { Types } from '@sabaki/sgf'
import { coordToVertex } from '../src/lib/board'
import type { CompiledProblemNode, ProblemBundle, ProblemCatalogEntry, ProblemViewport, ProblemVerdict, SourceRegistryEntry, StoneColor } from '../src/lib/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT_DIR, 'data')
const PROBLEMS_DIR = path.join(DATA_DIR, 'problems')
const SOURCES_PATH = path.join(DATA_DIR, 'sources.json')
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json')
const GENERATED_PATH = path.join(ROOT_DIR, 'src/generated/problems.json')

export async function loadSources(): Promise<SourceRegistryEntry[]> {
  return readJsonFile<SourceRegistryEntry[]>(SOURCES_PATH)
}

export async function loadCatalog(): Promise<ProblemCatalogEntry[]> {
  return readJsonFile<ProblemCatalogEntry[]>(CATALOG_PATH)
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const contents = await readFile(filePath, 'utf8')
  return JSON.parse(contents) as T
}

export async function writeGeneratedProblems(problems: ProblemBundle[]): Promise<void> {
  await mkdir(path.dirname(GENERATED_PATH), { recursive: true })
  await writeFile(GENERATED_PATH, `${JSON.stringify(problems, null, 2)}\n`, 'utf8')
}

export async function validateProjectData(): Promise<ProblemBundle[]> {
  const sources = await loadSources()
  const catalog = await loadCatalog()

  const sourceIds = new Set<string>()
  for (const source of sources) {
    assert(source.id.trim().length > 0, 'Source id is required.')
    assert(!sourceIds.has(source.id), `Duplicate source id: ${source.id}`)
    assert(source.license.trim().length > 0, `Source ${source.id} must declare a license.`)
    assert(source.evidenceUrl.trim().length > 0, `Source ${source.id} must declare an evidenceUrl.`)
    sourceIds.add(source.id)
  }

  const catalogIds = new Set<string>()
  const catalogSlugs = new Set<string>()
  const discoveredFiles = new Set((await readdir(PROBLEMS_DIR)).filter((file) => file.endsWith('.sgf')))

  const bundles = await Promise.all(
    catalog.map(async (entry) => {
      assert(!catalogIds.has(entry.id), `Duplicate problem id: ${entry.id}`)
      assert(!catalogSlugs.has(entry.slug), `Duplicate problem slug: ${entry.slug}`)
      assert(sourceIds.has(entry.sourceId), `Problem ${entry.id} references unknown source ${entry.sourceId}`)
      assert(entry.boardSize === 19, `Problem ${entry.id} must use boardSize 19 for MVP.`)

      catalogIds.add(entry.id)
      catalogSlugs.add(entry.slug)

      const expectedFile = `${entry.id}.sgf`
      assert(discoveredFiles.has(expectedFile), `Missing SGF file for ${entry.id}: ${expectedFile}`)
      discoveredFiles.delete(expectedFile)

      return compileProblem(entry)
    }),
  )

  assert(discoveredFiles.size === 0, `Unmapped SGF files found: ${[...discoveredFiles].join(', ')}`)
  return bundles
}

export async function compileProblem(entry: ProblemCatalogEntry): Promise<ProblemBundle> {
  const sgfPath = path.join(PROBLEMS_DIR, `${entry.id}.sgf`)
  const contents = await readFile(sgfPath, 'utf8')
  const trees = sgf.parse(contents) as Types.NodeObject[]

  assert(trees.length === 1, `Problem ${entry.id} must contain exactly one game tree.`)
  const root = trees[0]

  const initialStones = {
    black: root.data.AB ?? [],
    white: root.data.AW ?? [],
  }

  const compiledNodes: CompiledProblemNode[] = []
  walkTree(root, entry.toPlay, compiledNodes)

  const nodeIndex = new Map(compiledNodes.map((node) => [node.id, node]))
  const rootNode = nodeIndex.get(String(root.id))
  assert(rootNode, `Problem ${entry.id} is missing a root node.`)

  const rootChildren = rootNode.children.map((childId) => nodeIndex.get(childId)).filter(Boolean) as CompiledProblemNode[]
  const correctFirstMoves = rootChildren.filter((child) => child.player === entry.toPlay && child.verdict === 'correct')

  assert(correctFirstMoves.length === 1, `Problem ${entry.id} must have exactly one first correct move tagged with TE[2].`)
  assert(correctFirstMoves[0].move != null, `Problem ${entry.id} first correct move cannot be a pass.`)

  for (const node of compiledNodes) {
    if (node.player === entry.toPlay && node.verdict !== 'wrong') {
      const autoChildren = node.children.map((childId) => nodeIndex.get(childId)).filter(Boolean) as CompiledProblemNode[]
      const nonWrongAuto = autoChildren.filter((child) => child.autoPlay && child.verdict !== 'wrong')
      assert(nonWrongAuto.length <= 1, `Problem ${entry.id} node ${node.id} has more than one auto-play response.`)
    }
  }

  const coords = [...initialStones.black, ...initialStones.white]
  for (const node of compiledNodes) {
    if (node.move) coords.push(node.move)
  }

  return {
    ...entry,
    initialStones,
    viewport: buildViewport(coords, entry.boardSize),
    rootNodeId: String(root.id),
    nodes: compiledNodes,
  }
}

function walkTree(node: Types.NodeObject, toPlay: StoneColor, out: CompiledProblemNode[]): void {
  const move = node.data.B?.[0] ?? node.data.W?.[0] ?? null
  const player: StoneColor | null = node.data.B ? 'B' : node.data.W ? 'W' : null
  const verdict = getVerdict(node)

  out.push({
    id: String(node.id),
    move,
    player,
    verdict,
    comment: node.data.C?.[0]?.trim() || undefined,
    autoPlay: player != null && player !== toPlay,
    children: node.children.map((child) => String(child.id)),
  })

  for (const child of node.children) {
    walkTree(child, toPlay, out)
  }
}

function getVerdict(node: Types.NodeObject): ProblemVerdict {
  if (node.data.BM?.includes('2')) return 'wrong'
  if (node.data.TE?.includes('2')) return 'correct'
  return 'neutral'
}

function buildViewport(coords: string[], boardSize: number): ProblemViewport {
  const vertices = coords.map((coord) => coordToVertex(coord)).filter(Boolean) as Array<[number, number]>
  if (vertices.length === 0) {
    return { top: 0, left: 0, width: boardSize, height: boardSize }
  }

  let left = Math.max(0, Math.min(...vertices.map((vertex) => vertex[0])) - 2)
  let right = Math.min(boardSize - 1, Math.max(...vertices.map((vertex) => vertex[0])) + 2)
  let top = Math.max(0, Math.min(...vertices.map((vertex) => vertex[1])) - 2)
  let bottom = Math.min(boardSize - 1, Math.max(...vertices.map((vertex) => vertex[1])) + 2)

  ;[left, right] = ensureMinSpan(left, right, boardSize, 7)
  ;[top, bottom] = ensureMinSpan(top, bottom, boardSize, 7)

  return {
    top,
    left,
    width: right - left + 1,
    height: bottom - top + 1,
  }
}

function ensureMinSpan(start: number, stop: number, limit: number, minSpan: number): [number, number] {
  let nextStart = start
  let nextStop = stop

  while (nextStop - nextStart + 1 < minSpan && (nextStart > 0 || nextStop < limit - 1)) {
    if (nextStart > 0) nextStart -= 1
    if (nextStop - nextStart + 1 >= minSpan) break
    if (nextStop < limit - 1) nextStop += 1
  }

  return [nextStart, nextStop]
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
