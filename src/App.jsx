import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import LogoUpload from './components/LogoUpload'
import ClientInfo from './components/ClientInfo'
import DatesInfo from './components/DatesInfo'
import ItemsTable from './components/ItemsTable'
import NotesTerms from './components/NotesTerms'
import SummaryPanel from './components/SummaryPanel'

export default function App() {
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

	const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0)
	const tax = (subtotal * taxRate) / 100
	const total = subtotal + tax
	const balanceDue = total - amountPaid

	useEffect(() => {
		localStorage.setItem('invoiceItems', JSON.stringify(items))
	}, [items])

	const handleDownload = () => {
		const doc = new jsPDF('p', 'pt', 'a4')
		const m = 40,
			pageW = doc.internal.pageSize.getWidth()
		let y = m

		if (logo) {
			const img = new Image()
			img.src = logo
			img.onload = () => {
				const maxW = 120,
					ratio = img.width / img.height
				doc.addImage(img, 'PNG', m, y, maxW, maxW / ratio)
				drawPDF()
			}
		} else drawPDF()

		function drawPDF() {
			// titre & numéro
			doc.setFontSize(24)
			doc.text('INVOICE', pageW - m, y + 10, { align: 'right' })
			doc.setFontSize(12)
			doc.text(`# ${invoiceNumber}`, pageW - m, y + 30, { align: 'right' })
			y += 60

			// infos & dates
			doc.setFontSize(10)
			doc.text(`De : ${clientData.issuer}`, m, y)
			doc.text(`Bill To: ${clientData.billTo}`, m, y + 15)
			if (clientData.shipTo)
				doc.text(`Ship To: ${clientData.shipTo}`, m, y + 30)
			const rx = pageW - m
			doc.text(`Date : ${dates.date}`, rx, y, { align: 'right' })
			doc.text(`Terms : ${dates.terms}`, rx, y + 15, { align: 'right' })
			doc.text(`Due Date : ${dates.dueDate}`, rx, y + 30, { align: 'right' })
			doc.text(`PO # : ${dates.poNumber}`, rx, y + 45, { align: 'right' })
			y += 80

			// tableau
			autoTable(doc, {
				startY: y,
				margin: { left: m, right: m },
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

			// totaux
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

			// notes & terms
			doc.text('Notes:', m, y)
			doc.text(notesTerms.notes || '-', m + 40, y)
			doc.text('Terms:', m, y + 15)
			doc.text(notesTerms.terms || '-', m + 40, y + 15)

			doc.save(`invoice_${invoiceNumber}.pdf`)
		}
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* Colonne gauche (2/3) */}
				<div className='md:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200'>
					{/* Header principal */}
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

				{/* Colonne droite (1/3) */}
				<aside className='bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4'>
					<button
						onClick={handleDownload}
						className='w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center'>
						<svg className='w-5 h-5 mr-2' /* icon */>…</svg>
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
