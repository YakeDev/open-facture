import { useContext } from 'react'
import { AuthContext } from '../context/AuthContextBase.js'

export default function useAuth() {
	return useContext(AuthContext)
}
