import { useState } from 'react'

export default function InvoiceForm({ onAdd }) {
	const [client, setClient] = useState('')
	const [amount, setAmount] = useState('')

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!client || !amount) return
		onAdd({ id: Date.now(), client, amount })
		setClient('')
		setAmount('')
	}

	return (
		<form onSubmit={handleSubmit} className='bg-white p-4 rounded shadow'>
			<h2 className='text-xl font-semibold mb-2'>Nouvelle facture</h2>
			<div className='mb-2'>
				<label className='block text-sm'>Client</label>
				<input
					type='text'
					value={client}
					onChange={(e) => setClient(e.target.value)}
					className='w-full border p-1 rounded'
				/>
			</div>
			<div className='mb-2'>
				<label className='block text-sm'>Montant (€)</label>
				<input
					type='number'
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className='w-full border p-1 rounded'
				/>
			</div>
			<button
				type='submit'
				className='mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
				Ajouter
			</button>
		</form>
	)
}
