import { createContext } from 'react'

export const AuthContext = createContext({
	user: null,
	loading: true,
	error: null,
	login: async () => {},
	register: async () => {},
	logout: async () => {},
	setError: () => {},
})
