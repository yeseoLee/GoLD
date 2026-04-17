import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import App from './App'

vi.mock('goban', () => ({
  JGOFNumericPlayerColor: { BLACK: 1, WHITE: 2 },
  setGobanRenderer: vi.fn(),
  Goban: { setCallbacks: vi.fn() },
  createGoban: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}))

describe('GoLD app', () => {
  it('renders the problem list as prose rows and supports navigation flows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '중급' }))
    expect(screen.getByRole('button', { name: '사활 문제 34 시작' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '사활 문제 1 시작' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '입문' }))
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: '사활 문제 1 시작' }))

    expect(screen.getByRole('button', { name: 'play-cr' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '해답 보기' }))
    expect(screen.getByText('해답 재생')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByRole('heading', { level: 2, name: '사활 문제 2' })).toBeInTheDocument()
  })
})
