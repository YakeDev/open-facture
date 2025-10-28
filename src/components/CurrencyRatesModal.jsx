import React, { useEffect, useState } from 'react'

export default function CurrencyRatesModal({
	open,
	onClose,
	onSubmit,
	currencyOptions,
	currentRates,
}) {
	const [formValues, setFormValues] = useState({})
	const [error, setError] = useState(null)

	useEffect(() => {
		if (!open) return
		const initialValues = currencyOptions.reduce((acc, option) => {
			if (option.code === 'USD') return acc
			const currentValue = currentRates?.[option.code]
			acc[option.code] =
				currentValue != null ? String(currentValue) : option.fallbackUsdRate || ''
			return acc
		}, {})
		setFormValues(initialValues)
		setError(null)
	}, [open, currencyOptions, currentRates])

	if (!open) {
		return null
	}

	const handleChange = (code) => (event) => {
		setFormValues((prev) => ({
			...prev,
			[code]: event.target.value,
		}))
	}

	const handleSubmit = (event) => {
		event.preventDefault()
		const nextRates = {}

		for (const option of currencyOptions) {
			if (option.code === 'USD') continue
			const rawValue = formValues[option.code]
			if (!rawValue) {
				setError(`Veuillez saisir un taux pour ${option.code}.`)
				return
			}
			const normalized = Number(String(rawValue).replace(',', '.'))
			if (!Number.isFinite(normalized) || normalized <= 0) {
				setError(`Le taux ${option.code} doit être un nombre positif.`)
				return
			}
			nextRates[option.code] = Number(normalized.toFixed(6))
		}

		onSubmit(nextRates)
	}

	return (
		<div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'>
			<div className='w-full max-w-lg rounded-lg bg-white p-6 shadow-xl'>
				<div className='flex items-start justify-between'>
					<div>
						<h2 className='text-lg font-semibold text-gray-900'>
							Ajuster les taux USD
						</h2>
						<p className='mt-1 text-sm text-gray-600'>
							Indiquez la valeur en dollars USD pour 1 unité de chaque devise.
						</p>
					</div>
					<button
						type='button'
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className='mt-4 space-y-3'>
					{currencyOptions
						.filter((option) => option.code !== 'USD')
						.map((option) => (
							<div key={option.code}>
								<label
									className='block text-sm font-medium text-gray-700'
									htmlFor={`rate-${option.code}`}>
									{option.label}
								</label>
								<input
									id={`rate-${option.code}`}
									type='number'
									step='0.000001'
									min='0'
									value={formValues[option.code] ?? ''}
									onChange={handleChange(option.code)}
									className='mt-1 w-full rounded border border-gray-300 p-2'
									required
								/>
							</div>
						))}

					{error ? (
						<div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
							{error}
						</div>
					) : null}

					<div className='flex justify-end gap-3 pt-2'>
						<button
							type='button'
							onClick={onClose}
							className='rounded border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50'>
							Annuler
						</button>
						<button
							type='submit'
							className='rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700'>
							Enregistrer
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
