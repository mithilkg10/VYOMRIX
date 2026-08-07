import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RootLayout from '@/app/layout'
import { ReactNode } from 'react'

// Mock next/font to prevent errors during test
vi.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter',
  }),
}))

describe('RootLayout Boundary', () => {
  it('renders children within providers', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Application</div>
      </RootLayout>
    )
    
    // Check if child is rendered
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Test Application')).toBeInTheDocument()
  })
})
