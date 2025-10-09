import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
	const { login } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const [form, setForm] = useState({ email: '', password: '' })
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

	const handleChange = (event) => {
		const { name, value } = event.target
		setForm((prev) => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError(null)
		setLoading(true)
		try {
			await login(form)
			const redirect = location.state?.from?.pathname || '/'
			navigate(redirect, { replace: true })
		} catch (err) {
			setError(err.message || 'Connexion impossible.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-100 p-4'>
			<div className='w-full max-w-md bg-white p-6 rounded shadow border border-gray-200'>
				<h1 className='text-2xl font-semibold mb-4 text-center'>Connexion</h1>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='block text-sm text-gray-600 mb-1'>Email</label>
						<input
							type='email'
							name='email'
							value={form.email}
							onChange={handleChange}
							required
							className='w-full border border-gray-200 rounded p-2'
						/>
					</div>
					<div>
						<label className='block text-sm text-gray-600 mb-1'>Mot de passe</label>
						<input
							type='password'
							name='password'
							value={form.password}
							onChange={handleChange}
							required
							className='w-full border border-gray-200 rounded p-2'
						/>
					</div>
					{error ? (
						<div className='text-sm text-red-500 bg-red-50 border border-red-200 rounded p-2'>
							{error}
						</div>
					) : null}
					<button
						type='submit'
						disabled={loading}
						className='w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50'>
						{loading ? 'Connexion…' : 'Se connecter'}
					</button>
				</form>
				<p className='mt-4 text-sm text-center text-gray-600'>
					Pas encore de compte ?{' '}
					<Link to='/register' className='text-green-600 hover:underline'>
						Créer un compte
					</Link>
				</p>
			</div>
		</div>
	)
}
