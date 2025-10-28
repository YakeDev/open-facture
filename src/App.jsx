import React, { useCallback } from 'react'
import {
	BrowserRouter,
	Navigate,
	NavLink,
	Route,
	Routes,
} from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import useAuth from './hooks/useAuth'
import InvoiceBuilderPage from './pages/InvoiceBuilder'
import DashboardPage from './pages/Dashboard'
import HistoryPage from './pages/History'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'

function AppHeader({ userEmail, onLogout }) {
	return (
		<header className='mb-4 border-b border-gray-200 bg-white'>
			<div className='mx-auto flex max-w-6xl flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between'>
				<div className='flex items-center gap-3'>
					<span className='text-xl font-semibold text-green-600'>
						Open Facture
					</span>
					<nav className='flex items-center gap-3 text-sm font-medium'>
						<NavLink
							to='/'
							className={({ isActive }) =>
								isActive
									? 'text-green-600'
									: 'text-gray-600 hover:text-green-600'
							}>
							Créer
						</NavLink>
				<NavLink
					to='/dashboard'
					className={({ isActive }) =>
						isActive
							? 'text-green-600'
							: 'text-gray-600 hover:text-green-600'
					}>
					Tableau de bord
				</NavLink>
						<NavLink
							to='/history'
							className={({ isActive }) =>
								isActive
									? 'text-green-600'
									: 'text-gray-600 hover:text-green-600'
							}>
							Historique local
						</NavLink>
					</nav>
				</div>
				<div className='flex items-center gap-3 text-sm text-gray-600'>
					{userEmail ? <span>{userEmail}</span> : null}
					<button
						type='button'
						onClick={onLogout}
						className='text-red-600 hover:underline'>
						Se déconnecter
					</button>
				</div>
			</div>
		</header>
	)
}

export default function App() {
	const { user, logout, loading } = useAuth()

	const handleLogout = useCallback(async () => {
		try {
			await logout()
		} catch (error) {
			console.error('logout error', error)
		}
	}, [logout])

	return (
		<BrowserRouter>
			{user && !loading ? (
				<AppHeader userEmail={user.email} onLogout={handleLogout} />
			) : null}
			<Routes>
				<Route
					path='/login'
					element={
						user && !loading ? <Navigate to='/' replace /> : <LoginPage />
					}
				/>
				<Route
					path='/register'
					element={
						user && !loading ? <Navigate to='/' replace /> : <RegisterPage />
					}
				/>
				<Route
					path='/'
					element={
						<ProtectedRoute>
							<InvoiceBuilderPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/dashboard'
					element={
						<ProtectedRoute>
							<DashboardPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/history'
					element={
						<ProtectedRoute>
							<HistoryPage />
						</ProtectedRoute>
					}
				/>
				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>
		</BrowserRouter>
	)
}
