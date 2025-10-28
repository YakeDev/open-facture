import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoiceApi } from '../services/api'
import {
	loadHistory,
	saveHistory,
	clearHistory,
} from '../utils/storage'
import {
	toLocalHistoryEntry,
	formatInvoiceTotal,
} from '../utils/invoice'

const PAGE_LIMIT = 50

export default function HistoryPage() {
	const [history, setHistory] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [pagination, setPagination] = useState({
		page: 1,
		totalPages: 1,
	})
	const navigate = useNavigate()

	useEffect(() => {
		const controller = new AbortController()
		let active = true

		const load = async () => {
			try {
				const data = await invoiceApi.list({
					params: { page: 1, limit: PAGE_LIMIT },
					signal: controller.signal,
				})
				if (!active || !data) return
				const remote = (data.invoices || []).map(toLocalHistoryEntry)
				setHistory(remote)
				saveHistory(remote)
				setPagination(data.pagination || { page: 1, totalPages: 1 })
			} catch (err) {
				if (err?.name === 'AbortError') return
				console.error('history sync failed', err)
				if (!active) return
				setError(err.message || 'Impossible de charger les factures.')
				setHistory(loadHistory())
			} finally {
				if (active) {
					setLoading(false)
				}
			}
		}

		load()

		return () => {
			active = false
			controller.abort()
		}
	}, [])

	const canLoadMore = pagination.page < pagination.totalPages

	const handleLoadMore = async () => {
		if (!canLoadMore) return
		const nextPage = pagination.page + 1
		try {
			const data = await invoiceApi.list({
				params: { page: nextPage, limit: PAGE_LIMIT },
			})
			const remote = (data?.invoices || []).map(toLocalHistoryEntry)
			const nextHistory = [...history, ...remote]
			setHistory(nextHistory)
			saveHistory(nextHistory)
			setPagination(data?.pagination || pagination)
		} catch (err) {
			console.error('history pagination failed', err)
			window.alert(
				`Impossible de charger la page ${nextPage}. Veuillez réessayer plus tard.`
			)
		}
	}

	const exportCSV = () => {
		const rows = []
		history.forEach((inv) => {
			const items =
				Array.isArray(inv.items) && inv.items.length ? inv.items : [null]

			items.forEach((item) => {
				const quantity =
					item && Number.isFinite(Number(item.quantity))
						? Number(item.quantity)
						: ''
				const unitCost =
					item &&
					Number.isFinite(
						Number(
							item.unit_cost != null ? item.unit_cost : item.rate
						)
					)
						? Number(
								item.unit_cost != null ? item.unit_cost : item.rate
						  )
						: ''
				const amount =
					item &&
					item.amount !== undefined &&
					item.amount !== null &&
					item.amount !== ''
						? Number(item.amount)
						: item &&
							  typeof quantity === 'number' &&
							  typeof unitCost === 'number'
							? quantity * unitCost
							: ''

		rows.push({
			customer: inv.customer ?? '',
			issuer: inv.client?.issuer ?? inv.issuer ?? '',
			bill_to: inv.client?.billTo ?? inv.billTo ?? '',
			ship_to: inv.client?.shipTo ?? inv.shipTo ?? '',
			issuer_company: inv.issuerLegal?.companyName ?? '',
			issuer_address: inv.issuerLegal?.address ?? '',
			issuer_rccm: inv.issuerLegal?.rccm ?? '',
			issuer_id_nat: inv.issuerLegal?.idNat ?? '',
			issuer_niu: inv.issuerLegal?.niu ?? '',
			issuer_tax_centre: inv.issuerLegal?.taxCentre ?? '',
			issuer_bank: inv.issuerLegal?.bankName ?? '',
			issuer_account: inv.issuerLegal?.bankAccount ?? '',
			issuer_swift: inv.issuerLegal?.swift ?? '',
			type: inv.type ?? '',
					number: inv.number ?? '',
					date: inv.date ?? '',
					due_date: inv.due_date ?? '',
					payment_terms:
						inv.paymentTerms ?? inv.dates?.paymentTerms ?? '',
					currency_code: inv.currencyCode ?? inv.currency ?? '',
					currency_symbol: inv.currencySymbol ?? '',
					currency_label: inv.currencyLabel ?? '',
					currency_usd_rate: inv.currencyUsdRate ?? '',
					exchange_rates_usd: inv.exchangeRatesUSD
						? JSON.stringify(inv.exchangeRatesUSD)
						: '',
					exchange_rates_fetched_at:
						inv.exchangeRatesFetchedAt ?? '',
					subtotal: inv.subtotal ?? '',
					tax_rate: inv.taxRate ?? inv.tax ?? '',
					tax_amount: inv.taxAmount ?? '',
					total: inv.total ?? '',
					amount_paid: inv.amountPaid ?? '',
					balance_due: inv.balanceDue ?? '',
					item_description: item?.description ?? '',
					item_quantity: quantity,
					item_unit_cost: unitCost,
					item_amount: amount,
					notes: inv.notes ?? '',
					additional_terms: inv.additionalTerms ?? inv.terms ?? '',
					discount: inv.discount ?? '',
					shipping: inv.shipping ?? '',
					created_at: inv.createdAt ?? '',
					updated_at: inv.updatedAt ?? '',
				})
			})
		})
		if (!rows.length) return
		const headers = Object.keys(rows[0])
		const escapeValue = (value) => {
			const str = value == null ? '' : String(value)
			return `"${str.replace(/"/g, '""')}"`
		}
		const csv = [
			headers.join(','),
			...rows.map((row) => headers.map((h) => escapeValue(row[h])).join(',')),
		].join('\n')

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		anchor.href = url
		anchor.download = `Factures_${new Date().toISOString().slice(0, 10)}.csv`
		document.body.appendChild(anchor)
		anchor.click()
		document.body.removeChild(anchor)
	}

	const handleClear = () => {
		if (window.confirm("Effacer tout l'historique ?")) {
			clearHistory()
			setHistory([])
		}
	}

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-100 p-4'>
				<div className='mx-auto max-w-4xl rounded bg-white p-6 text-center text-gray-500 shadow'>
					Chargement de l'historique…
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='mx-auto max-w-4xl rounded bg-white p-6 shadow'>
				<h2 className='text-xl font-bold mb-2'>Historique</h2>
				<p className='text-gray-600 mb-4'>
					Nous enregistrons automatiquement les factures créées sur cet appareil.
				</p>
				{error ? (
					<div className='mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
						{error}
					</div>
				) : null}
				<div className='mb-4 flex justify-end space-x-2'>
					<button
						onClick={exportCSV}
						className='rounded border border-gray-300 px-4 py-2 hover:bg-gray-50'>
						Exporter
					</button>
					<button
						onClick={handleClear}
						className='rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600'>
						Effacer tout
					</button>
				</div>
				<table className='w-full border-separate border-spacing-0 divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							<th className='p-2 text-left'>Voir</th>
							<th className='p-2 text-left'>Client</th>
							<th className='p-2 text-left'>Référence</th>
							<th className='p-2 text-left'>Date</th>
							<th className='p-2 text-left'>Échéance</th>
							<th className='p-2 text-right'>Total</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-200 bg-white'>
						{history.map((inv, index) => (
							<tr key={`${inv.id}-${index}`}>
								<td className='p-2'>
									<button
										onClick={() =>
											navigate('/', { state: { invoiceIndex: index } })
										}
										className='rounded border px-2 py-1'>
										Voir
									</button>
								</td>
								<td className='p-2'>{inv.customer}</td>
								<td className='p-2'>{inv.number}</td>
								<td className='p-2'>{inv.date}</td>
								<td className='p-2'>{inv.due_date}</td>
								<td className='p-2 text-right'>
									{formatInvoiceTotal(inv)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{canLoadMore ? (
					<div className='mt-4 flex justify-end'>
						<button
							onClick={handleLoadMore}
							className='rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50'>
							Charger plus
						</button>
					</div>
				) : null}
			</div>
		</div>
	)
}
