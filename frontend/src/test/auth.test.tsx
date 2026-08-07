import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authApi } from '@/lib/api/auth'

// Mock the client apiRequest
vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from '@/lib/api/client'

describe('authApi module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCurrentUser makes correct request', async () => {
    const mockUser = { id: '1', email: 'test@example.com', role: 'admin' }
    vi.mocked(apiRequest).mockResolvedValueOnce(mockUser)

    const result = await authApi.getCurrentUser()
    expect(apiRequest).toHaveBeenCalledWith('/v1/auth/me')
    expect(result).toEqual(mockUser)
  })

  it('login makes correct request with form data', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ access_token: 'token' })
    const data = new URLSearchParams()
    data.append('username', 'test@example.com')
    data.append('password', 'password123')

    await authApi.login(data)
    expect(apiRequest).toHaveBeenCalledWith('/v1/auth/login', {
      method: 'POST',
      body: data.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  })
})
