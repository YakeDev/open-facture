import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
	const { user, loading } = useAuth()
	const location = useLocation()

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<span className='text-gray-500'>Chargement…</span>
			</div>
		)
	}

	if (!user) {
		return <Navigate to='/login' state={{ from: location }} replace />
	}

	return children
}
