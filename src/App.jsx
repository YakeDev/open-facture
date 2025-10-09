// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
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

const currencyOptions = [
	{ code: 'USD', label: 'USD ($)', symbol: '$', fallbackUsdRate: 1 },
	{ code: 'EUR', label: 'EUR (€)', symbol: '€', fallbackUsdRate: 1.08 },
	{ code: 'CDF', label: 'CDF (FC)', symbol: 'FC', fallbackUsdRate: 0.00035 },
	{ code: 'GBP', label: 'GBP (£)', symbol: '£', fallbackUsdRate: 1.27 },
	{ code: 'CAD', label: 'CAD ($)', symbol: '$', fallbackUsdRate: 0.74 },
]

const currencyMap = currencyOptions.reduce((acc, option) => {
	acc[option.code] = option
	return acc
}, {})

const DEFAULT_CURRENCY_CODE = 'USD'

const fallbackUsdRates = currencyOptions.reduce((acc, option) => {
	acc[option.code] = option.fallbackUsdRate
	return acc
}, {})

const getCurrencyMeta = (code) =>
	currencyMap[code] || currencyMap[DEFAULT_CURRENCY_CODE]

const formatInvoiceNumber = (index) =>
	`Fact-${String(index).padStart(4, '0')}`

const toCurrencyNumber = (value) => Number(Number(value || 0).toFixed(2))

function InvoicePage() {
	const navigate = useNavigate()
	const { state } = useLocation()
	const invoiceIndex = state?.invoiceIndex

	const [invoiceNumber, setInvoiceNumber] = useState(() => {
		const history = loadHistory()
		return formatInvoiceNumber(history.length + 1)
	})
	const [logo, setLogo] = useState(null)
	const [currencyCode, setCurrencyCode] = useState(() => {
		const stored = localStorage.getItem('defaultCurrencyCode')
		return stored && currencyMap[stored] ? stored : DEFAULT_CURRENCY_CODE
	})
	const currency = getCurrencyMeta(currencyCode)
	const previousCurrencyCodeRef = useRef(currencyCode)
	const pendingCurrencyHydrationRef = useRef(null)
	const [usdRates, setUsdRates] = useState(fallbackUsdRates)
	const [ratesUpdatedAt, setRatesUpdatedAt] = useState(null)
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
	const [editingIndex, setEditingIndex] = useState(null)

	const convertMoney = useCallback(
		(value, fromCode, toCode) => {
			const numeric = Number(value || 0)
			if (!Number.isFinite(numeric)) return 0

			const fromMeta = getCurrencyMeta(fromCode || DEFAULT_CURRENCY_CODE)
			const toMeta = getCurrencyMeta(toCode || DEFAULT_CURRENCY_CODE)

			const fromRate =
				usdRates[fromMeta.code] ??
				fallbackUsdRates[fromMeta.code] ??
				1
			const toRate =
				usdRates[toMeta.code] ??
				fallbackUsdRates[toMeta.code] ??
				1

			if (!fromRate || !toRate) return toCurrencyNumber(numeric)

			const usdValue = numeric * fromRate
			const converted = usdValue / toRate
			return toCurrencyNumber(converted)
			},
			[usdRates]
		)

	const handleEditCustomRates = useCallback(() => {
		const nextRates = { ...usdRates, USD: 1 }
		let modified = false

		currencyOptions.forEach(({ code, label }) => {
			if (code === 'USD') return

			const currentValue =
				nextRates[code] ?? fallbackUsdRates[code] ?? ''
			const input = window.prompt(
				`Combien vaut 1 ${code} (${label}) en dollars USD ?`,
				currentValue !== undefined && currentValue !== null
					? String(currentValue)
					: ''
			)

			if (input == null) return
			const normalized = input.trim().replace(',', '.')
			if (!normalized) return

			const value = Number(normalized)
			if (!Number.isFinite(value) || value <= 0) {
				window.alert(
					`Valeur invalide pour ${code}. Veuillez entrer un nombre positif.`
				)
				return
			}

			nextRates[code] = Number(value.toFixed(6))
			modified = true
		})

		if (!modified) return

		nextRates.USD = 1
		const timestamp = new Date().toISOString()
		setUsdRates(nextRates)
		setRatesUpdatedAt(timestamp)
		localStorage.setItem('customUsdRates', JSON.stringify(nextRates))
		localStorage.setItem('customUsdRatesUpdatedAt', timestamp)
	}, [usdRates])

	// Calculs financiers
	const subtotal = items.reduce(
		(sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
		0
	)
	const tax = (subtotal * taxRate) / 100
	const total = subtotal + tax
	const balanceDue = total - amountPaid

	// Persistance des items
	useEffect(() => {
		localStorage.setItem('invoiceItems', JSON.stringify(items))
	}, [items])

	useEffect(() => {
		const storedRates = localStorage.getItem('customUsdRates')
		const storedUpdatedAt = localStorage.getItem('customUsdRatesUpdatedAt')

		if (storedRates) {
			try {
				const parsedRates = JSON.parse(storedRates)
				if (
					parsedRates &&
					typeof parsedRates === 'object' &&
					Object.keys(parsedRates).length
				) {
					setUsdRates((prev) => ({ ...prev, ...parsedRates }))
				}
			} catch {
				// Ignore JSON errors and fallback to defaults
			}
		}

		if (storedUpdatedAt) {
			setRatesUpdatedAt(storedUpdatedAt)
		}
	}, [])

	// Si on vient de l'historique, on pré-remplit le formulaire
	useEffect(() => {
		if (invoiceIndex == null) return

		const history = loadHistory()
		const inv = history[invoiceIndex]
		if (inv) {
			setEditingIndex(invoiceIndex)
			setInvoiceNumber(inv.number || formatInvoiceNumber(invoiceIndex + 1))

			const nextCurrencyCode =
				inv.currencyCode || inv.currency || DEFAULT_CURRENCY_CODE
			const normalizedCurrencyCode = currencyMap[nextCurrencyCode]
				? nextCurrencyCode
				: DEFAULT_CURRENCY_CODE
			pendingCurrencyHydrationRef.current = normalizedCurrencyCode
			setCurrencyCode(normalizedCurrencyCode)

			setClientData({
				issuer:
					inv.client?.issuer ??
					inv.issuer ??
					inv.customer ??
					'',
				billTo:
					inv.client?.billTo ??
					inv.billTo ??
					inv.customer ??
					'',
				shipTo: inv.client?.shipTo ?? inv.shipTo ?? '',
			})

			setDates({
				date: inv.date ?? inv.dates?.date ?? '',
				terms:
					inv.dates?.paymentTerms ??
					inv.paymentTerms ??
					inv.terms ??
					'',
				dueDate: inv.due_date ?? inv.dates?.dueDate ?? '',
				poNumber: inv.poNumber ?? inv.dates?.poNumber ?? '',
			})

			setItems(
				Array.isArray(inv.items)
					? inv.items.map((it, idx) => ({
							id: it.id ?? Date.now() + idx,
							description: it.description ?? '',
							quantity: Number(it.quantity ?? 0),
							rate: Number(it.unit_cost ?? it.rate ?? 0),
					  }))
					: []
			)

			setTaxRate(Number(inv.taxRate ?? inv.tax ?? 0))
			setAmountPaid(Number(inv.amountPaid ?? 0))
			setNotesTerms({
				notes: inv.notes ?? '',
				terms: inv.additionalTerms ?? inv.terms ?? '',
			})
		}
		navigate('/', { replace: true })
	}, [invoiceIndex, navigate])

	useEffect(() => {
		const prevCode = previousCurrencyCodeRef.current
		if (!prevCode) {
			previousCurrencyCodeRef.current = currencyCode
			return
		}

		if (prevCode === currencyCode) {
			pendingCurrencyHydrationRef.current = null
			return
		}

		if (pendingCurrencyHydrationRef.current === currencyCode) {
			previousCurrencyCodeRef.current = currencyCode
			pendingCurrencyHydrationRef.current = null
			return
		}

		setItems((prevItems) =>
			prevItems.map((item) => {
				const rate = Number(item.rate ?? 0)
				const convertedRate = Number.isFinite(rate)
					? convertMoney(rate, prevCode, currencyCode)
					: rate
				return { ...item, rate: convertedRate }
			})
		)

		setAmountPaid((prev) => {
			const amount = Number(prev ?? 0)
			return Number.isFinite(amount)
				? convertMoney(amount, prevCode, currencyCode)
				: amount
		})

		previousCurrencyCodeRef.current = currencyCode
		pendingCurrencyHydrationRef.current = null
	}, [currencyCode, convertMoney])

	const currencySuffix = currency.symbol || currency.code || ''
	const formatMoney = (value) => {
		const base = Number(value || 0).toFixed(2).replace('.', ',')
		return currencySuffix ? `${base} ${currencySuffix}` : base
	}

	const rateSummary = currencyOptions
		.map(({ code }) => {
			const raw =
				usdRates[code] ??
				fallbackUsdRates[code] ??
				(code === 'USD' ? 1 : null)
			const numeric = Number(raw)
			const formatted = Number.isFinite(numeric)
				? numeric.toFixed(4)
				: '—'
			return `${code}: ${formatted}`
		})
		.join(' • ')

	// Génération et téléchargement du PDF
	const handleDownload = () => {
		const doc = new jsPDF('p', 'pt', 'a4')
		const margin = 40
		const pageW = doc.internal.pageSize.getWidth()
		let y = margin

			const finalizeInvoice = () => {
				const history = loadHistory()
				const existing = editingIndex != null ? history[editingIndex] : null
				const timestamp = new Date().toISOString()
				const createdAt = existing?.createdAt ?? timestamp
				const subtotalValue = toCurrencyNumber(subtotal)
				const taxValue = toCurrencyNumber(tax)
				const totalValue = toCurrencyNumber(total)
				const amountPaidValue = toCurrencyNumber(amountPaid)
				const balanceDueValue = toCurrencyNumber(balanceDue)
				const currencyUsdRate =
					usdRates[currency.code] ??
					fallbackUsdRates[currency.code] ??
					1
				const exchangeRatesSnapshot = currencyOptions.reduce(
					(acc, option) => {
						acc[option.code] =
							usdRates[option.code] ??
							fallbackUsdRates[option.code] ??
							null
						return acc
					},
					{}
				)

				const invoiceRecord = {
					type: 'invoice',
					number: invoiceNumber,
					customer: clientData.billTo || clientData.issuer,
					currency: currency.code,
					currencyCode: currency.code,
					currencySymbol: currency.symbol,
					currencyLabel: currency.label,
					currencyUsdRate,
					exchangeRatesUSD: exchangeRatesSnapshot,
					exchangeRatesFetchedAt: ratesUpdatedAt,
					date: dates.date,
					due_date: dates.dueDate,
					paymentTerms: dates.terms,
					poNumber: dates.poNumber,
					dates: {
						date: dates.date,
						paymentTerms: dates.terms,
						dueDate: dates.dueDate,
						poNumber: dates.poNumber,
					},
					subtotal: subtotalValue,
					tax: taxRate,
					taxRate,
					taxAmount: taxValue,
					total: totalValue,
					amountPaid: amountPaidValue,
					balanceDue: balanceDueValue,
					shipping: existing?.shipping ?? 0,
					discount: existing?.discount ?? 0,
					client: {
						issuer: clientData.issuer,
						billTo: clientData.billTo,
						shipTo: clientData.shipTo,
					},
					issuer: clientData.issuer,
					billTo: clientData.billTo,
					shipTo: clientData.shipTo,
					notes: notesTerms.notes,
					additionalTerms: notesTerms.terms,
					terms: notesTerms.terms,
					items: items.map((i, idx) => ({
						id: i.id ?? Date.now() + idx,
						description: i.description,
						quantity: Number(i.quantity ?? 0),
						unit_cost: toCurrencyNumber(Number(i.rate ?? 0)),
						amount: toCurrencyNumber(
							Number(i.quantity ?? 0) * Number(i.rate ?? 0)
						),
					})),
					createdAt,
					updatedAt: timestamp,
				}

			const updatedHistory = addInvoiceToHistory(
				invoiceRecord,
				editingIndex ?? undefined
			)

			if (editingIndex != null) {
				setEditingIndex(null)
				setInvoiceNumber(invoiceRecord.number)
			} else {
				const nextNumber = formatInvoiceNumber(updatedHistory.length + 1)
				setInvoiceNumber(nextNumber)
			}
		}

		// 1) Logo avec taille max
		if (logo) {
			const img = new Image()
			img.src = logo
			img.onload = () => {
				const maxW = 100
				const maxH = 50
				const ratio = img.width / img.height
				let imgW, imgH

				if (ratio >= 1) {
					imgW = maxW
					imgH = maxW / ratio
				} else {
					imgH = maxH
					imgW = maxH * ratio
				}

				doc.addImage(img, 'PNG', margin, y, imgW, imgH)
				y += imgH + 20
				renderPDF()
			}
			img.onerror = renderPDF
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
			if (clientData.shipTo) {
				doc.text(`Ship To: ${clientData.shipTo}`, margin, y + 30)
			}
			const rx = pageW - margin
			doc.text(`Date : ${dates.date}`, rx, y, { align: 'right' })
			doc.text(`Modalités : ${dates.terms}`, rx, y + 15, { align: 'right' })
			doc.text(`Échéance : ${dates.dueDate}`, rx, y + 30, { align: 'right' })
			doc.text(`PO # : ${dates.poNumber}`, rx, y + 45, { align: 'right' })
			y += clientData.shipTo ? 95 : 80

			// 4) Tableau des items
			autoTable(doc, {
				startY: y,
				margin: { left: margin, right: margin },
				head: [['Item', 'Qty', 'Rate', 'Amount']],
				body: items.map((i) => [
					i.description,
					(Number(i.quantity) || 0).toString(),
					formatMoney(Number(i.rate) || 0),
					formatMoney((Number(i.quantity) || 0) * (Number(i.rate) || 0)),
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
			doc.text(`Subtotal:    ${formatMoney(subtotal)}`, rx, y, {
				align: 'right',
			})
			doc.text(`Taxe (${taxRate}%): ${formatMoney(tax)}`, rx, y + 15, {
				align: 'right',
			})
			doc.text(`Total:       ${formatMoney(total)}`, rx, y + 30, {
				align: 'right',
			})
			doc.text(`Payé:        ${formatMoney(amountPaid)}`, rx, y + 45, {
				align: 'right',
			})
			doc.text(`Solde dû:    ${formatMoney(balanceDue)}`, rx, y + 60, {
				align: 'right',
			})
			y += 90

			// 6) Notes & terms
			doc.text('Notes:', margin, y)
			doc.text(notesTerms.notes || '-', margin + 40, y, {
				maxWidth: pageW - margin * 2 - 40,
			})
			doc.text('Terms:', margin, y + 15)
			doc.text(notesTerms.terms || '-', margin + 40, y + 15, {
				maxWidth: pageW - margin * 2 - 40,
			})

			// 7) Sauvegarde du PDF
			doc.save(`invoice_${invoiceNumber}.pdf`)

			// 8) Enregistrement dans l'historique
			finalizeInvoice()
		}
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* Création de la facture */}
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
									readOnly
									className='border border-gray-200 p-1 rounded w-28 text-right bg-gray-100 cursor-not-allowed'
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
							value={currencyCode}
							onChange={(e) => setCurrencyCode(e.target.value)}
							className='w-full border border-gray-200 rounded p-2'>
							{currencyOptions.map((option) => (
								<option key={option.code} value={option.code}>
									{option.label}
								</option>
							))}
						</select>
						<button
							type='button'
							onClick={() =>
								localStorage.setItem('defaultCurrencyCode', currencyCode)
							}
							className='mt-2 text-green-600 text-sm hover:underline'>
							Enregistrer par défaut
						</button>
						<button
							type='button'
							onClick={handleEditCustomRates}
							className='mt-2 text-blue-600 text-sm hover:underline'>
							Ajuster les taux
						</button>
						<div className='mt-3 text-xs text-gray-500 space-y-1'>
							<p>
								{ratesUpdatedAt
									? `Taux personnalisés du ${new Date(
											ratesUpdatedAt
									  ).toLocaleString()}`
									: 'Taux intégrés (aucune personnalisation).'}
							</p>
							<p>1 unité = valeur en USD.</p>
							<p className='leading-4'>{rateSummary}</p>
						</div>
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

	const formatTotal = (inv) => {
		const totalValue = Number(inv.total ?? 0)
		const amount = Number.isFinite(totalValue)
			? totalValue.toFixed(2)
			: '0.00'
		const code = inv.currencyCode ?? inv.currency ?? ''
		const currencyMeta = (code && currencyMap[code]) || undefined
		const suffix =
			inv.currencyLabel ??
			currencyMeta?.label ??
			inv.currencySymbol ??
			currencyMeta?.symbol ??
			code ??
			''
		return suffix ? `${amount} ${suffix}` : amount
	}

	const exportCSV = () => {
		const rows = []
		history.forEach((inv) => {
			const items = Array.isArray(inv.items) && inv.items.length
				? inv.items
				: [null]

			items.forEach((item) => {
				const code = inv.currencyCode ?? inv.currency ?? ''
				const currencyMeta =
					(code && currencyMap[code]) || undefined

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
					type: inv.type ?? '',
					number: inv.number ?? '',
					date: inv.date ?? '',
					due_date: inv.due_date ?? '',
					payment_terms:
						inv.paymentTerms ?? inv.dates?.paymentTerms ?? '',
					currency_code: code,
						currency_symbol:
							inv.currencySymbol ?? currencyMeta?.symbol ?? '',
						currency_label: inv.currencyLabel ?? currencyMeta?.label ?? '',
						currency_usd_rate: inv.currencyUsdRate ?? '',
						exchange_rates_usd: inv.exchangeRatesUSD
							? JSON.stringify(inv.exchangeRatesUSD)
							: '',
						exchange_rates_fetched_at: inv.exchangeRatesFetchedAt ?? '',
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
			...rows.map((r) => headers.map((h) => escapeValue(r[h])).join(',')),
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
									{formatTotal(inv)}
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
