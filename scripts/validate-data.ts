import { validateProjectData } from './data-utils'

async function main() {
  const bundles = await validateProjectData()
  console.log(`Validated ${bundles.length} problems.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
