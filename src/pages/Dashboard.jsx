import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, invoiceApi } from '../services/api'

export default function DashboardPage() {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [summary, setSummary] = useState({
		totalInvoices: 0,
		totalAmount: 0,
		totalPaid: 0,
		totalOutstanding: 0,
		recent: [],
	})

	useEffect(() => {
		const controller = new AbortController()
		let mounted = true

		const loadSummary = async () => {
			setLoading(true)
			try {
				const data = await dashboardApi.summary({
					signal: controller.signal,
				})
				if (!mounted) return
				setSummary({
					totalInvoices: data?.summary?.totalInvoices ?? 0,
					totalAmount: data?.summary?.totalAmount ?? 0,
					totalPaid: data?.summary?.totalPaid ?? 0,
					totalOutstanding: data?.summary?.totalOutstanding ?? 0,
					recent: data?.summary?.recent ?? [],
				})
			} catch (err) {
				if (!mounted || err?.name === 'AbortError') return
				try {
					const fallback = await invoiceApi.list({
						signal: controller.signal,
					})
					if (!mounted) return
					const invoices = fallback?.invoices ?? []
					setSummary({
						totalInvoices: invoices.length,
						totalAmount: invoices.reduce(
							(sum, invoice) => sum + Number(invoice.total || 0),
							0
						),
						totalPaid: invoices.reduce(
							(sum, invoice) => sum + Number(invoice.amountPaid || 0),
							0
						),
						totalOutstanding: invoices.reduce(
							(sum, invoice) => sum + Number(invoice.balanceDue || 0),
							0
						),
						recent: invoices
							.slice()
							.sort(
								(a, b) =>
									new Date(b.issueDate).getTime() -
									new Date(a.issueDate).getTime()
							)
							.slice(0, 5),
					})
					setError(null)
				} catch (fallbackError) {
					console.error('dashboard fallback failed', fallbackError)
					setError(
						err.message || 'Impossible de charger les indicateurs.'
					)
				}
			} finally {
				if (mounted) {
					setLoading(false)
				}
			}
		}

		loadSummary()

		return () => {
			mounted = false
			controller.abort()
		}
	}, [])

	const stats = useMemo(() => {
		return {
			totalInvoices: summary.totalInvoices,
			totalAmount: summary.totalAmount,
			totalPaid: summary.totalPaid,
			totalOutstanding: summary.totalOutstanding,
			recent: summary.recent,
		}
	}, [summary])

	if (loading) {
		return (
			<div className='min-h-screen bg-gray-100 p-6'>
				<div className='max-w-6xl mx-auto'>
					<p className='text-gray-500'>Chargement des indicateurs…</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='min-h-screen bg-gray-100 p-6'>
				<div className='max-w-6xl mx-auto'>
					<div className='bg-red-50 border border-red-200 text-red-600 p-4 rounded'>
						{error}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<div className='bg-white border border-gray-200 rounded shadow p-6'>
					<h1 className='text-2xl font-semibold mb-2'>Tableau de bord</h1>
					<p className='text-gray-600'>
						Vision globale de vos factures et paiements.
					</p>
				</div>

				<div className='grid gap-4 md:grid-cols-4'>
					<StatCard title='Factures' value={stats.totalInvoices} />
					<StatCard title='Total facturé' value={stats.totalAmount} />
					<StatCard title='Total encaissé' value={stats.totalPaid} />
					<StatCard title='Solde dû' value={stats.totalOutstanding} />
				</div>

				<div className='bg-white border border-gray-200 rounded shadow'>
					<div className='p-4 border-b border-gray-100 flex items-center justify-between'>
						<h2 className='text-lg font-semibold'>Dernières factures</h2>
						<Link to='/' className='text-sm text-green-600 hover:underline'>
							Créer une facture
						</Link>
					</div>
					<table className='w-full table-fixed border-separate border-spacing-0'>
						<thead className='bg-gray-50 text-left text-sm text-gray-600'>
							<tr>
								<th className='p-3 font-medium'>Référence</th>
								<th className='p-3 font-medium'>Client</th>
								<th className='p-3 font-medium'>Date</th>
								<th className='p-3 font-medium text-right'>Total</th>
								<th className='p-3 font-medium text-right'>Solde dû</th>
							</tr>
						</thead>
						<tbody className='text-sm'>
							{stats.recent.length === 0 ? (
								<tr>
									<td colSpan={5} className='p-4 text-center text-gray-500'>
										Aucune facture pour le moment.
									</td>
								</tr>
							) : (
								stats.recent.map((invoice) => (
									<tr key={invoice.id} className='border-t border-gray-100'>
										<td className='p-3'>{invoice.number}</td>
										<td className='p-3'>{invoice.customerName}</td>
										<td className='p-3'>
											{new Date(invoice.issueDate).toLocaleDateString()}
										</td>
										<td className='p-3 text-right'>
											{Number(invoice.total).toFixed(2)} {invoice.currency}
										</td>
										<td className='p-3 text-right'>
											{Number(invoice.balanceDue).toFixed(2)} {invoice.currency}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

function StatCard({ title, value }) {
	return (
		<div className='bg-white border border-gray-200 rounded shadow p-4'>
			<p className='text-sm text-gray-500'>{title}</p>
			<p className='text-2xl font-semibold mt-1'>
				{typeof value === 'number' ? value.toLocaleString() : value}
			</p>
		</div>
	)
}
