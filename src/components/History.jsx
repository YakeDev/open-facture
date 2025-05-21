// src/components/History.jsx
import React, { useState, useEffect } from 'react'
import { loadHistory, clearHistory } from '../utils/storage'

export default function History() {
	const [history, setHistory] = useState([])

	useEffect(() => {
		setHistory(loadHistory())
	}, [])

	const exportCSV = () => {
		// une ligne par item
		const rows = []
		history.forEach((inv) => {
			inv.items.forEach((item) => {
				rows.push({
					customer: inv.customer,
					type: inv.type,
					number: inv.number,
					date: inv.date,
					due_date: inv.due_date,
					currency: inv.currency,
					subtotal: inv.subtotal,
					tax: inv.tax,
					total: inv.total,
					shipping: inv.shipping,
					discount: inv.discount,
					item: item.description,
					quantity: item.quantity,
					unit_cost: item.unit_cost,
				})
			})
		})

		const headers = Object.keys(rows[0] || {})
		const csv = [
			headers.join(','),
			...rows.map((r) => headers.map((h) => `"${r[h]}"`).join(',')),
		].join('\n')

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `Invoices ${new Date().toISOString().slice(0, 10)}.csv`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}

	const handleClear = () => {
		if (window.confirm("Effacer tout l'historique ?")) {
			clearHistory()
			setHistory([])
		}
	}

	return (
		<div className='max-w-4xl mx-auto bg-white p-6 rounded-lg shadow'>
			<h2 className='text-xl font-bold mb-4'>Histoire</h2>
			<p className='text-gray-600 mb-4'>
				Nous enregistrons automatiquement les factures […].
			</p>
			<div className='flex justify-end space-x-2 mb-4'>
				<button
					onClick={exportCSV}
					className='px-4 py-2 border border-gray-300 rounded hover:bg-gray-50'>
					Exporter
				</button>
				<button
					onClick={handleClear}
					className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'>
					Effacer tout
				</button>
			</div>
			<table className='w-full table-fixed border-separate border-spacing-0 divide-y divide-gray-200'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='p-2 text-left'>Voir</th>
						<th className='p-2 text-left'>Client</th>
						<th className='p-2 text-left'>Réf</th>
						<th className='p-2 text-left'>Date</th>
						<th className='p-2 text-left'>Échéance</th>
						<th className='p-2 text-right'>Total</th>
						<th className='p-2'></th>
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200'>
					{history.map((inv, i) => (
						<tr key={i}>
							<td className='p-2'>
								<button className='px-2 py-1 border rounded'>Voir</button>
							</td>
							<td className='p-2'>{inv.customer}</td>
							<td className='p-2'>{inv.number}</td>
							<td className='p-2'>{inv.date}</td>
							<td className='p-2'>{inv.due_date}</td>
							<td className='p-2 text-right'>
								{inv.total.toFixed(2)} {inv.currency}
							</td>
							<td className='p-2 text-center'>
								{/* un bouton supprimer par ligne, si désiré */}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
