import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import App from './App'

vi.mock('@sabaki/shudan/src/main.js', () => ({
  BoundedGoban: ({ rangeX = [0, 18], rangeY = [0, 18], onVertexClick }: any) => {
    const buttons = []
    for (let y = rangeY[0]; y <= rangeY[1]; y += 1) {
      for (let x = rangeX[0]; x <= rangeX[1]; x += 1) {
        const coord = String.fromCharCode(97 + x, 97 + y)
        buttons.push(
          <button key={coord} data-testid={`vertex-${coord}`} onClick={(event) => onVertexClick?.(event, [x, y])} type="button">
            {coord}
          </button>,
        )
      }
    }

    return <div data-testid="mock-goban">{buttons}</div>
  },
}))

describe('GoLD app', () => {
  it('filters the imported list and supports play, solution, and navigation flows', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '중급' }))
    expect(screen.getByRole('button', { name: '사활 문제 34 시작' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '사활 문제 1 시작' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '입문' }))
    await user.click(screen.getByRole('button', { name: '사활 문제 1 시작' }))

    await user.click(screen.getByRole('button', { name: '해답 보기' }))
    expect(screen.getByText('해답 재생')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByRole('heading', { level: 2, name: '사활 문제 2' })).toBeInTheDocument()
  })
})
