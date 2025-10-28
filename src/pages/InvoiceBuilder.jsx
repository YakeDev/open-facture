import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import LogoUpload from '../components/LogoUpload'
import ClientInfo from '../components/ClientInfo'
import DatesInfo from '../components/DatesInfo'
import ItemsTable from '../components/ItemsTable'
import NotesTerms from '../components/NotesTerms'
import SummaryPanel from '../components/SummaryPanel'
import IssuerInfo from '../components/IssuerInfo'
import CurrencyRatesModal from '../components/CurrencyRatesModal'
import useInvoiceBuilder from '../hooks/useInvoiceBuilder'

const loadImageAsDataUrl = async (src) => {
	if (!src) return null
	if (src.startsWith('data:')) return src
	const response = await fetch(src, { credentials: 'include' })
	const blob = await response.blob()
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onloadend = () => resolve(reader.result)
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}

const getImageDimensions = (dataUrl) =>
	new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({ width: img.width, height: img.height })
		img.onerror = reject
		img.src = dataUrl
	})

const formatLines = (lines) => lines.filter(Boolean)

const GREY = {
	text: [45, 45, 45],
	muted: [90, 90, 90],
	border: [205, 205, 205],
	head: [232, 232, 232],
	alt: [246, 246, 246],
}

export default function InvoiceBuilderPage() {
	const navigate = useNavigate()
	const { state: navigationState } = useLocation()
	const invoiceIndex = navigationState?.invoiceIndex

	const { state, derived, actions } = useInvoiceBuilder()

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
		issuer,
	} = state

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
		setIssuer,
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
		const pageWidth = doc.internal.pageSize.getWidth()
		let cursorY = margin

		const currencySuffix = currency.symbol || currency.code || ''
		const formatCurrency = (value) => {
			const base = Number(value || 0).toFixed(2).replace('.', ',')
			return currencySuffix ? `${base} ${currencySuffix}` : base
		}

		const headerLines = formatLines([
			issuer.companyName?.trim(),
			issuer.phone ? `Tél. : ${issuer.phone}` : null,
			issuer.email ? `Email : ${issuer.email}` : null,
		])

		const legalLines = formatLines([
			issuer.address ? `Adresse : ${issuer.address}` : null,
			issuer.rccm ? `RCCM : ${issuer.rccm}` : null,
			issuer.idNat ? `ID Nat : ${issuer.idNat}` : null,
			issuer.niu ? `NIU / N° Impôt : ${issuer.niu}` : null,
			issuer.taxCentre ? `Centre des impôts : ${issuer.taxCentre}` : null,
			issuer.bankName ? `Banque : ${issuer.bankName}` : null,
			issuer.bankAccount ? `Compte : ${issuer.bankAccount}` : null,
			issuer.swift ? `SWIFT / BIC : ${issuer.swift}` : null,
			issuer.other,
		])

		doc.setFont('Helvetica', 'bold')
		doc.setFontSize(22)
		const titleX = pageWidth - margin
		doc.text('FACTURE', titleX, cursorY, { align: 'right' })
		cursorY += 18
		doc.setFont('Helvetica', 'normal')
		doc.setFontSize(11)
		doc.text(`Numéro : ${invoiceNumber}`, titleX, cursorY, { align: 'right' })
		cursorY = margin

		let logoHeight = 0
		if (logo) {
			try {
				const dataUrl = await loadImageAsDataUrl(logo)
				if (dataUrl) {
					const { width, height } = await getImageDimensions(dataUrl)
					const maxWidth = 140
					const maxHeight = 80
					const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
					const displayWidth = width * ratio
					logoHeight = height * ratio
					doc.addImage(dataUrl, 'PNG', margin, cursorY, displayWidth, logoHeight)
				}
			} catch (error) {
				console.warn('PDF logo error', error)
			}
		}

		let headerBottom = cursorY + logoHeight
		if (headerLines.length) {
			let textY = cursorY + logoHeight + 12
			doc.setFont('Helvetica', 'bold')
			doc.setFontSize(12)
			doc.text(headerLines[0], margin, textY)
			doc.setFont('Helvetica', 'normal')
			doc.setFontSize(10)
			doc.setTextColor(...GREY.muted)
			let lineY = textY + 12
			headerLines.slice(1).forEach((line) => {
				doc.text(line, margin, lineY)
				lineY += 12
			})
			doc.setTextColor(0)
			headerBottom = headerLines.length > 1 ? lineY - 12 : textY
		} else {
			doc.setTextColor(0)
		}

		cursorY = headerBottom + 16
		doc.setDrawColor(...GREY.border)
		doc.line(margin, cursorY, pageWidth - margin, cursorY)
		cursorY += 18

		doc.setFont('Helvetica', 'bold')
		doc.setFontSize(12)
		doc.text('Destinataire', margin, cursorY)
		doc.text('Adresse de livraison', pageWidth / 2, cursorY)
		cursorY += 18

		doc.setFont('Helvetica', 'normal')
		doc.setFontSize(10)
		const billingLines = formatLines([
			clientData.billTo || clientData.issuer || '-',
			clientData.address,
			clientData.clientPhone ? `Téléphone : ${clientData.clientPhone}` : null,
			clientData.clientEmail ? `Email : ${clientData.clientEmail}` : null,
		])
	const shippingLines = formatLines([clientData.shipTo || '-'])

		let billingY = cursorY
		billingLines.forEach((line) => {
			doc.text(line, margin, billingY, { maxWidth: pageWidth / 2 - margin })
			billingY += 13
		})

		let shippingY = cursorY
		shippingLines.forEach((line) => {
			doc.text(line, pageWidth / 2, shippingY, { maxWidth: pageWidth / 2 - margin })
			shippingY += 13
		})

		cursorY = Math.max(billingY, shippingY) + 18

		autoTable(doc, {
			startY: cursorY,
			theme: 'grid',
			margin: { left: margin, right: margin },
			styles: {
				fillColor: [255, 255, 255],
				textColor: GREY.text,
				lineColor: GREY.border,
				lineWidth: 0.4,
				fontSize: 9.5,
			},
			headStyles: {
				fillColor: GREY.head,
				textColor: GREY.text,
				fontStyle: 'bold',
			},
			alternateRowStyles: {
				fillColor: GREY.alt,
			},
			head: [['Date', 'Modalités', 'Échéance', 'N° commande']],
			body: [
				[
					dates.date || '-',
					dates.terms || '-',
					dates.dueDate || '-',
					dates.poNumber || '-',
				],
			],
		})

		cursorY = doc.lastAutoTable.finalY + 16

		const tableBody = items.map((item) => [
			item.description || '-',
			Number(item.quantity || 0).toFixed(2),
			formatCurrency(item.rate || 0),
			formatCurrency((item.quantity || 0) * (item.rate || 0)),
		])

		autoTable(doc, {
			startY: cursorY,
			theme: 'grid',
			margin: { left: margin, right: margin },
			styles: {
				fontSize: 10,
				cellPadding: 6,
				fillColor: [255, 255, 255],
				textColor: GREY.text,
				lineColor: GREY.border,
				lineWidth: 0.4,
			},
			headStyles: {
				fillColor: GREY.head,
				textColor: GREY.text,
				fontStyle: 'bold',
			},
			alternateRowStyles: {
				fillColor: GREY.alt,
			},
			columnStyles: {
				1: { halign: 'right' },
				2: { halign: 'right' },
				3: { halign: 'right' },
			},
			head: [['Description', 'Qté', 'Tarif', 'Montant']],
			body: tableBody,
		})

		cursorY = doc.lastAutoTable.finalY + 24

		const summaryX = pageWidth - margin
		const labelX = summaryX - 150
		const summaryLines = [
			{ label: 'Sous-total', value: formatCurrency(subtotal) },
			{
				label: `Taxe (${Number(taxRate || 0).toFixed(2)} %)`,
				value: formatCurrency(tax),
			},
			{ label: 'Total', value: formatCurrency(total), bold: true, size: 12.5 },
			{ label: 'Payé', value: formatCurrency(amountPaid) },
			{ label: 'Solde dû', value: formatCurrency(balanceDue), bold: true, size: 11.5 },
		]

		doc.setFontSize(10.5)
		summaryLines.forEach((line, index) => {
			const posY = cursorY + index * 18
			doc.setFont('Helvetica', line.bold ? 'bold' : 'normal')
			doc.setFontSize(line.size || 10.5)
			doc.text(line.label, labelX, posY)
			doc.text(line.value, summaryX, posY, { align: 'right' })
		})

		cursorY += summaryLines.length * 18 + 26

		doc.setFont('Helvetica', 'bold')
		doc.setFontSize(11)
		doc.text('Notes :', margin, cursorY)
		doc.setFont('Helvetica', 'normal')
		doc.setFontSize(10)
		doc.text(notesTerms.notes || '-', margin + 48, cursorY, {
			maxWidth: pageWidth - margin * 2 - 48,
		})
		cursorY += 16
		doc.setFont('Helvetica', 'bold')
		doc.text('Conditions :', margin, cursorY)
		doc.setFont('Helvetica', 'normal')
		doc.text(notesTerms.terms || '-', margin + 70, cursorY, {
			maxWidth: pageWidth - margin * 2 - 70,
		})

		if (legalLines.length) {
			cursorY += 24
			doc.setFont('Helvetica', 'bold')
			doc.setFontSize(10.5)
			doc.text('Informations légales', margin, cursorY)
			cursorY += 14
			doc.setFont('Helvetica', 'normal')
			doc.setFontSize(9.5)
			doc.setTextColor(...GREY.muted)
			legalLines.forEach((line) => {
				doc.text(line, margin, cursorY, { maxWidth: pageWidth - margin * 2 })
				cursorY += 12
			})
			doc.setTextColor(0)
		}

		doc.save(`facture_${invoiceNumber}.pdf`)
		await finalizeInvoice()
	}

	return (
		<div className='min-h-screen bg-gray-100 p-4'>
			<div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3'>
				<div className='md:col-span-2 space-y-6 rounded border border-gray-200 bg-white p-6 shadow'>
					<LogoUpload logo={logo} onUpload={uploadLogo} />
					<IssuerInfo data={issuer} onChange={setIssuer} />
					<ClientInfo data={clientData} onChange={setClientData} />
					<DatesInfo data={dates} onChange={setDates} />
					<ItemsTable items={items} setItems={setItems} currency={currency} />
					<NotesTerms data={notesTerms} onChange={setNotesTerms} />
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

				<aside className='space-y-4 rounded border border-gray-200 bg-white p-6 shadow'>
					<button
						onClick={handleDownload}
						className='w-full rounded bg-gray-900 px-4 py-2 text-white transition hover:bg-gray-700'>
						Télécharger
					</button>

					<div>
						<label className='mb-1 block text-sm text-gray-600'>Devise</label>
						<select
							value={currencyCode}
							onChange={(event) => setCurrencyCode(event.target.value)}
							className='w-full rounded border border-gray-200 p-2'>
							{currencyOptions.map((option) => (
								<option key={option.code} value={option.code}>
									{option.label}
								</option>
							))}
						</select>
						<button
							type='button'
							onClick={saveDefaultCurrency}
							className='mt-2 text-sm text-green-600 hover:underline'>
							Enregistrer par défaut
						</button>
						<button
							type='button'
							onClick={() => setRatesModalOpen(true)}
							className='mt-2 block text-sm text-blue-600 hover:underline'>
							Ajuster les taux
						</button>
						<div className='mt-3 space-y-1 text-xs text-gray-500 leading-4'>
							<p>
								Devise par défaut : {defaultCurrencyMeta.label}
								{defaultCurrencySavedAt
									? ` (enregistrée le ${new Date(defaultCurrencySavedAt).toLocaleString()})`
									: ''}
							</p>
							<p>
								{ratesUpdatedAt
									? `Taux personnalisés du ${new Date(ratesUpdatedAt).toLocaleString()}`
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
