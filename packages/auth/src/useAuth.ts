import { useState, useEffect, useCallback } from 'react'
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  isAuthenticated,
  getCurrentUser as getCurrentUserService,
} from './auth'
import type { AuthActionResult, RegisterRequest, User } from './types'

interface UseAuthResult {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (account: string, password: string) => Promise<AuthActionResult>
  register: (params: RegisterRequest) => Promise<AuthActionResult>
  logout: () => Promise<void>
  refreshUser: () => void
}

function useAuth(): UseAuthResult {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  const refreshUser = useCallback(() => {
    const currentUser = getCurrentUserService()
    setUser(currentUser)
    setAuthenticated(isAuthenticated())
  }, [])

  useEffect(() => {
    refreshUser()
    setIsLoading(false)
  }, [refreshUser])

  const login = useCallback(
    async (account: string, password: string): Promise<AuthActionResult> => {
      setIsLoading(true)

      const result = await loginService({ account, password })

      if (!result.user) {
        setIsLoading(false)
        return result
      }

      setUser(result.user)
      setAuthenticated(true)
      setIsLoading(false)
      return result
    },
    []
  )

  const register = useCallback(async (params: RegisterRequest): Promise<AuthActionResult> => {
    setIsLoading(true)

    const result = await registerService(params)

    if (!result.user) {
      setIsLoading(false)
      return result
    }

    setUser(result.user)
    setAuthenticated(true)
    setIsLoading(false)
    return result
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)

    await logoutService()

    setUser(null)
    setAuthenticated(false)
    setIsLoading(false)
  }, [])

  return {
    isAuthenticated: authenticated,
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }
}

export type { UseAuthResult }

export { useAuth }
