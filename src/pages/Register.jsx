import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const currencyOptions = [
	{ code: 'USD', label: 'USD ($)' },
	{ code: 'EUR', label: 'EUR (€)' },
	{ code: 'CDF', label: 'CDF (FC)' },
	{ code: 'GBP', label: 'GBP (£)' },
	{ code: 'CAD', label: 'CAD ($)' },
]

export default function RegisterPage() {
	const { register } = useAuth()
	const navigate = useNavigate()
	const [form, setForm] = useState({
		name: '',
		email: '',
		password: '',
		defaultCurrency: 'USD',
	})
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
			await register(form)
			navigate('/', { replace: true })
		} catch (err) {
			setError(err.message || "Impossible de créer l'utilisateur.")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-100 p-4'>
			<div className='w-full max-w-md bg-white p-6 rounded shadow border border-gray-200'>
				<h1 className='text-2xl font-semibold mb-4 text-center'>Créer un compte</h1>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label className='block text-sm text-gray-600 mb-1'>Nom / Entreprise</label>
						<input
							type='text'
							name='name'
							value={form.name}
							onChange={handleChange}
							className='w-full border border-gray-200 rounded p-2'
							placeholder='Optionnel'
						/>
					</div>
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
							minLength={8}
							required
							className='w-full border border-gray-200 rounded p-2'
						/>
						<p className='text-xs text-gray-500 mt-1'>
							Minimum 8 caractères (utilise une phrase ou un mix de caractères).
						</p>
					</div>
					<div>
						<label className='block text-sm text-gray-600 mb-1'>Devise par défaut</label>
						<select
							name='defaultCurrency'
							value={form.defaultCurrency}
							onChange={handleChange}
							className='w-full border border-gray-200 rounded p-2'>
							{currencyOptions.map((option) => (
								<option key={option.code} value={option.code}>
									{option.label}
								</option>
							))}
						</select>
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
						{loading ? 'Création…' : 'Créer mon compte'}
					</button>
				</form>
				<p className='mt-4 text-sm text-center text-gray-600'>
					Déjà un compte ?{' '}
					<Link to='/login' className='text-green-600 hover:underline'>
						Se connecter
					</Link>
				</p>
			</div>
		</div>
	)
}
