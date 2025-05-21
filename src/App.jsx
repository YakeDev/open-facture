// src/App.jsx
import React, { useState, useEffect } from 'react'
import {
	BrowserRouter,
	Routes,
	Route,
	Link,
	useNavigate,
	useLocation,
} from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { loadHistory, addInvoiceToHistory, clearHistory } from './utils/storage'

import LogoUpload from './components/LogoUpload'
import ClientInfo from './components/ClientInfo'
import DatesInfo from './components/DatesInfo'
import ItemsTable from './components/ItemsTable'
import NotesTerms from './components/NotesTerms'
import SummaryPanel from './components/SummaryPanel'

function InvoicePage() {
	const navigate = useNavigate()
	const { state } = useLocation()
	const invoiceIndex = state?.invoiceIndex

	const [logo, setLogo] = useState(null)
	const [invoiceNumber, setInvoiceNumber] = useState('1')
	const [currency, setCurrency] = useState('USD ($)')
	const [clientData, setClientData] = useState({
		issuer: '',
		billTo: '',
		shipTo: '',
	})
	const [dates, setDates] = useState({
		date: '',
		terms: '',
		dueDate: '',
		poNumber: '',
	})
	const [items, setItems] = useState(() => {
		const s = localStorage.getItem('invoiceItems')
		return s ? JSON.parse(s) : []
	})
	const [notesTerms, setNotesTerms] = useState({ notes: '', terms: '' })
	const [taxRate, setTaxRate] = useState(0)
	const [amountPaid, setAmountPaid] = useState(0)

	// Totaux calculés
	const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0)
	const tax = (subtotal * taxRate) / 100
	const total = subtotal + tax
	const balanceDue = total - amountPaid

	// Sauvegarde des items
	useEffect(() => {
		localStorage.setItem('invoiceItems', JSON.stringify(items))
	}, [items])

	// Pré-remplissage si on vient de l'historique
	useEffect(() => {
		if (invoiceIndex != null) {
			const history = loadHistory()
			const inv = history[invoiceIndex]
			if (inv) {
				setInvoiceNumber(inv.number)
				setCurrency(`${inv.currency} ($)`)
				setClientData({
					issuer: inv.customer,
					billTo: inv.customer,
					shipTo: '',
				})
				setDates({
					date: inv.date,
					terms: inv.terms || '',
					dueDate: inv.due_date,
					poNumber: inv.number,
				})
				setItems(
					inv.items.map((it, idx) => ({
						id: Date.now() + idx,
						description: it.description,
						quantity: it.quantity,
						rate: it.unit_cost,
					}))
				)
				setTaxRate(inv.tax)
				setAmountPaid(inv.amountPaid || 0)
				setNotesTerms({ notes: inv.notes || '', terms: inv.terms || '' })
			}
			navigate('/', { replace: true })
		}
	}, [invoiceIndex, navigate])

	// Génération & téléchargement PDF
	const handleDownload = () => {
		const doc = new jsPDF('p', 'pt', 'a4')
		const margin = 40
		const pageW = doc.internal.pageSize.getWidth()
		let y = margin

		// 1) Logo avec max W/H
		if (logo) {
			const img = new Image()
			img.src = logo
			img.onload = () => {
				const maxW = 100
				const maxH = 50
				const ratio = img.width / img.height
				let imgW, imgH

				if (ratio >= 1) {
					// paysage ou carrée
					imgW = maxW
					imgH = maxW / ratio
				} else {
					// portrait
					imgH = maxH
					imgW = maxH * ratio
				}

				doc.addImage(img, 'PNG', margin, y, imgW, imgH)
				y += imgH + 20
				renderPDF()
			}
		} else {
			y += 20
			renderPDF()
		}

		function renderPDF() {
			// 2) Titre & numéro
			doc.setFontSize(24)
			doc.text('INVOICE', pageW - margin, y + 10, { align: 'right' })
			doc.setFontSize(12)
			doc.text(`# ${invoiceNumber}`, pageW - margin, y + 30, { align: 'right' })
			y += 60

			// 3) Infos client & dates
			doc.setFontSize(10)
			doc.text(`De : ${clientData.issuer}`, margin, y)
			doc.text(`Bill To: ${clientData.billTo}`, margin, y + 15)
			const rx = pageW - margin
			doc.text(`Date : ${dates.date}`, rx, y, { align: 'right' })
			doc.text(`Terms : ${dates.terms}`, rx, y + 15, { align: 'right' })
			doc.text(`Due Date : ${dates.dueDate}`, rx, y + 30, { align: 'right' })
			doc.text(`PO # : ${dates.poNumber}`, rx, y + 45, { align: 'right' })
			y += 80

			// 4) Tableau items
			autoTable(doc, {
				startY: y,
				margin: { left: margin, right: margin },
				head: [['Item', 'Qty', 'Rate', 'Amount']],
				body: items.map((i) => [
					i.description,
					i.quantity.toString(),
					`${i.rate.toFixed(2).replace('.', ',')} ${currency}`,
					`${(i.quantity * i.rate).toFixed(2).replace('.', ',')} ${currency}`,
				]),
				styles: { fontSize: 10, cellPadding: 5 },
				headStyles: {
					fillColor: [31, 41, 55],
					textColor: 255,
					fontStyle: 'bold',
				},
				columnStyles: {
					1: { halign: 'center' },
					2: { halign: 'right' },
					3: { halign: 'right' },
				},
				tableLineColor: [229, 231, 235],
				tableLineWidth: 0.5,
			})
			y = doc.lastAutoTable.finalY + 20

			// 5) Totaux
			doc.text(
				`Subtotal:    ${subtotal.toFixed(2).replace('.', ',')} ${currency}`,
				rx,
				y,
				{ align: 'right' }
			)
			doc.text(
				`Taxe (${taxRate}%): ${tax.toFixed(2).replace('.', ',')} ${currency}`,
				rx,
				y + 15,
				{ align: 'right' }
			)
			doc.text(
				`Total:       ${total.toFixed(2).replace('.', ',')} ${currency}`,
				rx,
				y + 30,
				{ align: 'right' }
			)
			doc.text(
				`Payé:        ${amountPaid.toFixed(2).replace('.', ',')} ${currency}`,
				rx,
				y + 45,
				{ align: 'right' }
			)
			doc.text(
				`Solde dû:    ${balanceDue.toFixed(2).replace('.', ',')} ${currency}`,
				rx,
				y + 60,
				{ align: 'right' }
			)
			y += 90

			// 6) Notes & Terms
			doc.text('Notes:', margin, y)
			doc.text(notesTerms.notes || '-', margin + 40, y)
			doc.text('Terms:', margin, y + 15)
			doc.text(notesTerms.terms || '-', margin + 40, y + 15)

			// 7) Sauvegarde PDF
			doc.save(`invoice_${invoiceNumber}.pdf`)

			// 8) Enregistrement historique
			addInvoiceToHistory({
				customer: clientData.billTo || clientData.issuer,
				type: 'invoice',
				number: invoiceNumber,
				date: dates.date,
				due_date: dates.dueDate,
				currency: currency.split(' ')[0],
				subtotal,
				tax: taxRate,
				total,
				shipping: 0,
				discount: 0,
				items: items.map((i) => ({
					description: i.description,
					quantity: i.quantity,
					unit_cost: i.rate,
				})),
				notes: notesTerms.notes,
				terms: notesTerms.terms,
				amountPaid,
			})
		}
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* Création facture */}
				<div className='md:col-span-2 bg-white p-6 rounded shadow border border-gray-200'>
					<div className='flex justify-between items-start mb-6'>
						<LogoUpload logo={logo} onUpload={setLogo} />
						<div className='text-right'>
							<h1 className='text-3xl font-bold'>INVOICE</h1>
							<div className='mt-2 flex justify-end items-center'>
								<label className='w-8 text-sm text-gray-600 mr-2'>#</label>
								<input
									type='text'
									value={invoiceNumber}
									onChange={(e) => setInvoiceNumber(e.target.value)}
									className='border border-gray-200 p-1 rounded w-20 text-right'
								/>
							</div>
						</div>
					</div>

					<ClientInfo data={clientData} onChange={setClientData} />
					<DatesInfo data={dates} onChange={setDates} />
					<ItemsTable items={items} setItems={setItems} currency={currency} />
					<NotesTerms data={notesTerms} onChange={setNotesTerms} />

					<div className='mt-6'>
						<SummaryPanel
							subtotal={subtotal}
							taxRate={taxRate}
							onTaxChange={setTaxRate}
							total={total}
							amountPaid={amountPaid}
							onPaidChange={setAmountPaid}
							balanceDue={balanceDue}
							currency={currency}
						/>
					</div>
				</div>

				{/* Sidebar */}
				<aside className='bg-white p-6 rounded shadow border border-gray-200 space-y-4'>
					<button
						onClick={handleDownload}
						className='w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'>
						Télécharger
					</button>
					<div>
						<label className='block text-sm text-gray-600 mb-1'>Devise</label>
						<select
							value={currency}
							onChange={(e) => setCurrency(e.target.value)}
							className='w-full border border-gray-200 rounded p-2'>
							<option>USD ($)</option>
							<option>EUR (€)</option>
							<option>CDF (FC)</option>
						</select>
						<button className='mt-2 text-green-600 text-sm hover:underline'>
							Enregistrer par défaut
						</button>
					</div>
				</aside>
			</div>
		</div>
	)
}

function HistoryPage() {
	const [history, setHistory] = useState([])
	const navigate = useNavigate()

	useEffect(() => {
		setHistory(loadHistory())
	}, [])

	const exportCSV = () => {
		const rows = []
		history.forEach((inv, idx) =>
			inv.items.forEach((item) => {
				rows.push({
					customer: inv.customer,
					type: inv.type,
					number: inv.number,
					date: inv.date,
					due_date: inv.due_date,
					currency: inv.currency,
					total: inv.total,
					item: item.description,
					quantity: item.quantity,
					unit_cost: item.unit_cost,
					discount: inv.discount,
					tax: inv.tax,
					shipping: inv.shipping,
				})
			})
		)
		if (!rows.length) return
		const headers = Object.keys(rows[0])
		const csv = [
			headers.join(','),
			...rows.map((r) => headers.map((h) => `"${r[h]}"`).join(',')),
		].join('\n')

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `Invoices_${new Date().toISOString().slice(0, 10)}.csv`
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
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='max-w-4xl mx-auto bg-white p-6 rounded shadow'>
				<h2 className='text-xl font-bold mb-2'>Histoire</h2>
				<p className='text-gray-600 mb-4'>
					Nous enregistrons automatiquement les factures créées sur cet
					appareil.
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
					<tbody className='bg-white divide-y divide-gray-200'>
						{history.map((inv, i) => (
							<tr key={i}>
								<td className='p-2'>
									<button
										onClick={() =>
											navigate('/', { state: { invoiceIndex: i } })
										}
										className='px-2 py-1 border rounded'>
										Voir
									</button>
								</td>
								<td className='p-2'>{inv.customer}</td>
								<td className='p-2'>{inv.number}</td>
								<td className='p-2'>{inv.date}</td>
								<td className='p-2'>{inv.due_date}</td>
								<td className='p-2 text-right'>
									{inv.total.toFixed(2)} {inv.currency}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default function App() {
	return (
		<BrowserRouter>
			<nav className='bg-white border-b p-4 mb-4'>
				<Link to='/' className='mr-4 font-medium'>
					Créer facture
				</Link>
				<Link to='/history' className='font-medium'>
					Historique
				</Link>
			</nav>
			<Routes>
				<Route path='/' element={<InvoicePage />} />
				<Route path='/history' element={<HistoryPage />} />
			</Routes>
		</BrowserRouter>
	)
}
