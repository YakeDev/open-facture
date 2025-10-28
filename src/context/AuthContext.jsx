import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/api'
import { AuthContext } from './AuthContextBase.js'

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		const controller = new AbortController()
		let mounted = true

		authApi
			.me({ signal: controller.signal })
			.then((data) => {
				if (!mounted) return
				setUser(data?.user ?? null)
				setError(null)
			})
			.catch((err) => {
				if (!mounted || err?.name === 'AbortError') return
				setUser(null)
			})
			.finally(() => {
				if (!mounted) return
				setLoading(false)
			})

		return () => {
			mounted = false
			controller.abort()
		}
	}, [])

	const login = useCallback(async (credentials) => {
		setError(null)
		const data = await authApi.login(credentials)
		setUser(data.user)
		return data.user
	}, [])

	const register = useCallback(async (payload) => {
		setError(null)
		const data = await authApi.register(payload)
		setUser(data.user)
		return data.user
	}, [])

	const logout = useCallback(async () => {
		await authApi.logout()
		setUser(null)
	}, [])

	const value = useMemo(
		() => ({
			user,
			loading,
			error,
			login,
			register,
			logout,
			setError,
			setUser,
		}),
		[user, loading, error, login, register, logout, setError, setUser]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
