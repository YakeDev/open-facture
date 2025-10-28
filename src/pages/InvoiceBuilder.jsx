import React, { useEffect, useState } from 'react'
import {
	useLocation,
	useNavigate,
} from 'react-router-dom'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import LogoUpload from '../components/LogoUpload'
import ClientInfo from '../components/ClientInfo'
import DatesInfo from '../components/DatesInfo'
import ItemsTable from '../components/ItemsTable'
import NotesTerms from '../components/NotesTerms'
import SummaryPanel from '../components/SummaryPanel'
import CurrencyRatesModal from '../components/CurrencyRatesModal'
import useInvoiceBuilder from '../hooks/useInvoiceBuilder'

export default function InvoiceBuilderPage() {
	const navigate = useNavigate()
	const { state: navigationState } = useLocation()
	const invoiceIndex = navigationState?.invoiceIndex

	const {
		state: builderState,
		derived,
		actions,
	} = useInvoiceBuilder()

	const {
		invoiceNumber,
		logo,
		currencyCode,
		defaultCurrencySavedAt,
		usdRates,
		ratesUpdatedAt,
		clientData,
		dates,
		items,
		notesTerms,
		taxRate,
		amountPaid,
	} = builderState

	const {
		currency,
		defaultCurrencyMeta,
		currencyOptions,
		subtotal,
		tax,
		total,
		balanceDue,
		rateSummary,
	} = derived

	const {
		uploadLogo,
		setCurrencyCode,
		saveDefaultCurrency,
		updateCustomRates,
		setClientData,
		setDates,
		setItems,
		setNotesTerms,
		setTaxRate,
		setAmountPaid,
		hydrateFromHistory,
		finalizeInvoice,
	} = actions

	const [isRatesModalOpen, setRatesModalOpen] = useState(false)

	useEffect(() => {
		if (invoiceIndex == null) return
		const hydrated = hydrateFromHistory(invoiceIndex)
		if (hydrated) {
			navigate('/', { replace: true, state: {} })
		}
	}, [hydrateFromHistory, invoiceIndex, navigate])

	const handleRatesModalClose = () => setRatesModalOpen(false)
	const handleRatesModalSubmit = (nextRates) => {
		updateCustomRates(nextRates)
		setRatesModalOpen(false)
	}

	const handleDownload = async () => {
		const doc = new jsPDF('p', 'pt', 'a4')
		const margin = 40
		const pageW = doc.internal.pageSize.getWidth()
		let y = margin

		const currencySuffix = currency.symbol || currency.code || ''
		const formatCurrency = (value) => {
			const base = Number(value || 0).toFixed(2).replace('.', ',')
			return currencySuffix ? `${base} ${currencySuffix}` : base
		}

		doc.setFontSize(20)
		doc.text('FACTURE', margin, y)
		doc.setFontSize(12)
		doc.text(`Numéro: ${invoiceNumber}`, pageW - margin - 150, y, {
			maxWidth: 150,
		})
		y += 30

		if (logo) {
			try {
				doc.addImage(logo, 'PNG', margin, y, 120, 80)
			} catch (error) {
				console.warn('PDF logo error', error)
			}
		}

		doc.text(
			clientData.issuer || 'Votre entreprise',
			pageW - margin - 200,
			y,
			{ maxWidth: 200 }
		)
		y += 90

		doc.setFontSize(14)
		doc.text('Facturé à', margin, y)
		doc.text('Livrer à', pageW / 2, y)
		doc.setFontSize(12)
		y += 20

		doc.text(clientData.billTo || '-', margin, y, { maxWidth: pageW / 2 - 60 })
		doc.text(clientData.shipTo || '-', pageW / 2, y, {
			maxWidth: pageW / 2 - margin,
		})
		y += 40

		doc.autoTable({
			startY: y,
			head: [['Date', 'Modalités', 'Échéance', 'PO']],
			body: [
				[
					dates.date || '-',
					dates.terms || '-',
					dates.dueDate || '-',
					dates.poNumber || '-',
				],
			],
			margin: { left: margin, right: margin },
		})
		y = doc.lastAutoTable.finalY + 20

		const tableBody = items.map((item) => [
			item.description || '-',
			Number(item.quantity || 0).toFixed(2),
			formatCurrency(item.rate || 0),
			formatCurrency((item.quantity || 0) * (item.rate || 0)),
		])
		doc.autoTable({
			startY: y,
			head: [['Description', 'Qté', 'Tarif', 'Montant']],
			body: tableBody,
			margin: { left: margin, right: margin },
			styles: { cellPadding: 6 },
			headStyles: { fillColor: [34, 197, 94] },
		})
		y = doc.lastAutoTable.finalY + 20

		const summaryX = pageW - margin - 180
		doc.text(`Sous-total: ${formatCurrency(subtotal)}`, summaryX, y, {
			align: 'right',
		})
		doc.text(
			`Taxe (${Number(taxRate || 0).toFixed(2)}%): ${formatCurrency(tax)}`,
			summaryX,
			y + 15,
			{ align: 'right' }
		)
		doc.setFontSize(14)
		doc.text(`Total: ${formatCurrency(total)}`, summaryX, y + 35, {
			align: 'right',
		})
		doc.setFontSize(12)
		doc.text(`Payé: ${formatCurrency(amountPaid)}`, summaryX, y + 55, {
			align: 'right',
		})
		doc.text(`Solde dû: ${formatCurrency(balanceDue)}`, summaryX, y + 70, {
			align: 'right',
		})
		y += 100

		doc.text('Notes:', margin, y)
		doc.text(notesTerms.notes || '-', margin + 40, y, {
			maxWidth: pageW - margin * 2 - 40,
		})
		doc.text('Conditions:', margin, y + 15)
		doc.text(notesTerms.terms || '-', margin + 40, y + 15, {
			maxWidth: pageW - margin * 2 - 40,
		})

		doc.save(`invoice_${invoiceNumber}.pdf`)
		await finalizeInvoice()
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>
				<div className='md:col-span-2 bg-white p-6 rounded shadow border border-gray-200'>
					<div className='flex justify-between items-start mb-6'>
			<LogoUpload logo={logo} onUpload={uploadLogo} />
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
							onChange={(event) => setCurrencyCode(event.target.value)}
							className='w-full border border-gray-200 rounded p-2'>
							{currencyOptions.map((option) => (
								<option key={option.code} value={option.code}>
									{option.label}
								</option>
							))}
						</select>
						<button
							type='button'
							onClick={saveDefaultCurrency}
							className='mt-2 text-green-600 text-sm hover:underline'>
							Enregistrer par défaut
						</button>
						<button
							type='button'
							onClick={() => setRatesModalOpen(true)}
							className='mt-2 text-blue-600 text-sm hover:underline'>
							Ajuster les taux
						</button>
						<div className='mt-3 text-xs text-gray-500 space-y-1 leading-4'>
							<p>
								Devise par défaut&nbsp;: {defaultCurrencyMeta.label}
								{defaultCurrencySavedAt
									? ` (enregistrée le ${new Date(
											defaultCurrencySavedAt
									  ).toLocaleString()})`
									: ''}
							</p>
							<p>
								{ratesUpdatedAt
									? `Taux personnalisés du ${new Date(
											ratesUpdatedAt
									  ).toLocaleString()}`
									: 'Taux intégrés (aucune personnalisation).'}
							</p>
							<p>1 unité = valeur en USD.</p>
							<p>{rateSummary}</p>
						</div>
					</div>
				</aside>
			</div>

			<CurrencyRatesModal
				open={isRatesModalOpen}
				onClose={handleRatesModalClose}
				onSubmit={handleRatesModalSubmit}
				currencyOptions={currencyOptions}
				currentRates={usdRates}
			/>
		</div>
	)
}
