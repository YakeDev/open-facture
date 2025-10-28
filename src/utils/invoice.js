import { getCurrencyMeta } from '../constants/currencies.js'

export const toLocalHistoryEntry = (invoice) => {
	const currencyMeta = getCurrencyMeta(invoice.currency)
	return {
		id: invoice.id,
		type: 'invoice',
		number: invoice.number,
		customer: invoice.customerName,
		customerName: invoice.customerName,
		date: invoice.issueDate ? invoice.issueDate.slice(0, 10) : '',
		due_date: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
		currency: invoice.currency,
		currencyCode: invoice.currency,
		currencySymbol: currencyMeta.symbol,
		currencyLabel: currencyMeta.label,
		subtotal: invoice.subtotal,
		tax: invoice.taxRate,
		total: invoice.total,
		amountPaid: invoice.amountPaid,
		balanceDue: invoice.balanceDue,
	paymentTerms: invoice.terms,
	notes: invoice.notes,
	terms: invoice.additionalTerms ?? invoice.terms,
	currencyUsdRate: invoice.currencyUsdRate,
	exchangeRatesUSD: invoice.exchangeRatesSnapshot,
	exchangeRatesFetchedAt: invoice.exchangeRatesFetchedAt,
	createdAt: invoice.createdAt,
	updatedAt: invoice.updatedAt,
	issuerLegal: invoice.issuerLegal ?? invoice.issuerLegalInfo ?? null,
	clientPhone: invoice.clientPhone ?? '',
	clientEmail: invoice.clientContactEmail ?? invoice.clientEmail ?? '',
	items: (invoice.items || []).map((item) => ({
		description: item.description,
		quantity: item.quantity,
		unit_cost: item.unitCost,
		})),
	}
}

export const formatInvoiceTotal = (invoice) => {
	const totalValue = Number(invoice.total ?? 0)
	const amount = Number.isFinite(totalValue) ? totalValue.toFixed(2) : '0.00'
	const code = invoice.currencyCode ?? invoice.currency ?? ''
	const symbol = invoice.currencySymbol ?? ''
	const label = invoice.currencyLabel ?? ''
	return symbol
		? `${amount} ${symbol}`
		: label
		? `${amount} ${label}`
		: code
		? `${amount} ${code}`
		: amount
}
