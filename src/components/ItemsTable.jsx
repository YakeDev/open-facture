import React from 'react'

export default function ItemsTable({ items, setItems, currency }) {
	const onChange = (id, field) => (e) => {
		const v = field === 'description' ? e.target.value : Number(e.target.value)
		setItems(items.map((i) => (i.id === id ? { ...i, [field]: v } : i)))
	}
	const add = () =>
		setItems([
			...items,
			{ id: Date.now(), description: '', quantity: 1, rate: 0 },
		])
	const del = (id) => setItems(items.filter((i) => i.id !== id))

	const symbol = currency?.symbol ?? ''

	return (
		<div className='mb-6'>
			<table className='w-full border-separate border-spacing-0 divide-y divide-gray-200'>
				<thead className='bg-gray-800 text-white'>
					<tr>
		<th className='p-2 text-left border-b border-gray-200'>Ligne</th>
		<th className='p-2 text-center border-b border-gray-200'>
			Quantité
		</th>
		<th className='p-2 text-right border-b border-gray-200'>Tarif unitaire</th>
		<th className='p-2 text-right border-b border-gray-200'>Montant</th>
						<th className='p-2 border-b border-gray-200'></th>
					</tr>
				</thead>
				<tbody>
					{items.map((i) => (
						<tr key={i.id}>
							<td className='p-2 border-b border-gray-200'>
								<input
									type='text'
									value={i.description}
									onChange={onChange(i.id, 'description')}
									className='w-full border border-gray-200 p-1 rounded'
								/>
							</td>
							<td className='p-2 text-center border-b border-gray-200'>
								<input
									type='number'
									value={i.quantity}
									onChange={onChange(i.id, 'quantity')}
									className='w-12 border border-gray-200 p-1 rounded text-center'
								/>
							</td>
							<td className='p-2 text-right border-b border-gray-200'>
								<input
									type='number'
									value={i.rate}
									onChange={onChange(i.id, 'rate')}
									className='w-20 border border-gray-200 p-1 rounded text-right'
								/>
							</td>
							<td className='p-2 text-right border-b border-gray-200'>
								{(i.quantity * i.rate).toFixed(2).replace('.', ',')} {symbol}
							</td>
							<td className='p-2 text-center border-b border-gray-200'>
								<button onClick={() => del(i.id)} className='text-red-500'>
									×
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<button
				onClick={add}
				className='mt-2 text-green-600 hover:text-green-700'>
				+ Élément
			</button>
		</div>
	)
}
