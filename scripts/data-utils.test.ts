import { validateProjectData } from './data-utils'

describe('data pipeline', () => {
  it('maps catalog entries to SGF problems and validates unique first moves', async () => {
    const bundles = await validateProjectData()

    expect(bundles).toHaveLength(4)
    expect(bundles.every((bundle) => bundle.nodes.length > 0)).toBe(true)
    expect(bundles.every((bundle) => bundle.viewport.width >= 7)).toBe(true)
  })
})
