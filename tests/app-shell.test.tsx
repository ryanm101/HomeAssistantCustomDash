/* @vitest-environment jsdom */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
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
    expect(screen.getByTestId('status-dot')).toBeInTheDocument()
  })
})
