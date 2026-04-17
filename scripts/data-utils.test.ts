import { validateProjectData } from './data-utils'

describe('data pipeline', () => {
  it('maps catalog entries to imported SGF problems', async () => {
    const bundles = await validateProjectData()

    expect(bundles).toHaveLength(40)
    expect(bundles.every((bundle) => bundle.nodes.length > 0)).toBe(true)
    expect(bundles.every((bundle) => bundle.viewport.width >= 7)).toBe(true)
    expect(bundles.some((bundle) => bundle.tags.includes('one-move'))).toBe(true)
  })
})
