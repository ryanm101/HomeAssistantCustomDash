/* @vitest-environment jsdom */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import AppShell from '../src/app/AppShell'

describe('AppShell', () => {
  it('renders top bar, sidebar and footer', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    )
    expect(screen.getByText('rpidash')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /sidebar/i })).toBeInTheDocument()
    const sidebar = screen.getByRole('navigation', { name: /sidebar/i })
    const links = within(sidebar).getAllByRole('link')
    expect(links[0]).toHaveAccessibleName(/solar/i)
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })
})
