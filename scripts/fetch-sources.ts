import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSources } from './data-utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

async function main() {
  const sources = await loadSources()

  for (const source of sources) {
    const sourceDir = path.join(ROOT_DIR, 'data/raw', source.id)
    await mkdir(sourceDir, { recursive: true })
    await writeFile(path.join(sourceDir, 'source.json'), `${JSON.stringify(source, null, 2)}\n`, 'utf8')

    for (const asset of source.assets ?? []) {
      const response = await fetch(asset.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${asset.url}: ${response.status} ${response.statusText}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      await writeFile(path.join(sourceDir, asset.filename), buffer)
    }
  }

  console.log(`Fetched ${sources.length} approved sources into data/raw.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
