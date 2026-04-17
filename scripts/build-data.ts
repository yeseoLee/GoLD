import { validateProjectData, writeGeneratedProblems } from './data-utils'

async function main() {
  const bundles = await validateProjectData()
  await writeGeneratedProblems(bundles)
  console.log(`Built ${bundles.length} compiled problems into src/generated/problems.json.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
