import { Prisma } from '@prisma/client'
import {
	unprocessable,
	conflict,
	badRequest,
} from '../utils/httpError.js'

const MONEY_SCALE = 2
const RATE_SCALE = 6
const TOLERANCE = 0.02

const round = (value, scale = MONEY_SCALE) => {
	const factor = 10 ** scale
	return Math.round((Number(value) + Number.EPSILON) * factor) / factor
}

const toDecimal = (value, scale = MONEY_SCALE) =>
	new Prisma.Decimal(round(value ?? 0, scale))

const sanitizeString = (value) => {
	if (value == null) return null
	const trimmed = value.trim()
	return trimmed.length ? trimmed : null
}

const assertNonNegative = (value, field) => {
	if (!Number.isFinite(value) || value < 0) {
		throw unprocessable(`Le champ ${field} doit être positif`, {
			error: [{ path: [field], message: `Le champ ${field} doit être positif` }],
		})
	}
}

const assertClose = (field, provided, computed) => {
	if (provided == null) return
	if (Math.abs(provided - computed) > TOLERANCE) {
		throw unprocessable(
			`Le champ ${field} est incohérent par rapport aux éléments`,
			{
				error: [
					{
						path: [field],
						message: `Valeur attendue: ${computed.toFixed(2)}`,
					},
				],
			}
		)
	}
}

export const mapInvoice = (invoice) => ({
	...invoice,
	subtotal: Number(invoice.subtotal),
	taxRate: invoice.taxRate != null ? Number(invoice.taxRate) : null,
	taxAmount: invoice.taxAmount != null ? Number(invoice.taxAmount) : null,
	total: Number(invoice.total),
	amountPaid: Number(invoice.amountPaid),
	balanceDue: Number(invoice.balanceDue),
	currencyUsdRate:
		invoice.currencyUsdRate != null
			? Number(invoice.currencyUsdRate)
			: null,
	items: invoice.items.map((item) => ({
		...item,
		quantity: Number(item.quantity),
		unitCost: Number(item.unitCost),
		amount: Number(item.amount),
	})),
})

export const mapInvoices = (invoices) => invoices.map(mapInvoice)

export const buildInvoiceData = (payload, userId) => {
	const items = payload.items.map((item) => ({
		description: sanitizeString(item.description) || 'Item',
		quantity: Number(item.quantity ?? 0),
		unitCost: Number(item.unitCost ?? 0),
	}))

	if (!items.length) {
		throw badRequest('Une facture doit contenir au moins un élément.')
	}

	items.forEach((item, index) => {
		assertNonNegative(item.quantity, `items.${index}.quantity`)
		assertNonNegative(item.unitCost, `items.${index}.unitCost`)
	})

	const subtotal = round(
		items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
	)

	const rawTaxRate =
		typeof payload.taxRate === 'number' ? Number(payload.taxRate) : null
	if (rawTaxRate != null) {
		assertNonNegative(rawTaxRate, 'taxRate')
	}

	const computedTaxAmount =
		rawTaxRate != null ? round(subtotal * (rawTaxRate / 100)) : 0
	const providedTaxAmount =
		typeof payload.taxAmount === 'number'
			? Number(payload.taxAmount)
			: computedTaxAmount

	assertClose('subtotal', payload.subtotal, subtotal)
	assertClose('taxAmount', providedTaxAmount, computedTaxAmount)

	const total = round(subtotal + computedTaxAmount)
	const amountPaid = Number(payload.amountPaid ?? 0)
	assertNonNegative(amountPaid, 'amountPaid')
	if (amountPaid - total > TOLERANCE) {
		throw unprocessable('Le montant payé dépasse le total calculé', {
			error: [
				{
					path: ['amountPaid'],
					message: `Le montant payé doit être inférieur ou égal à ${total.toFixed(
						2
					)}`,
				},
			],
		})
	}

	const balanceDue = round(Math.max(total - amountPaid, 0))
	assertClose('total', payload.total, total)
	assertClose('balanceDue', payload.balanceDue, balanceDue)

	const currencyUsdRate =
		typeof payload.currencyUsdRate === 'number'
			? Number(payload.currencyUsdRate)
			: null
	if (currencyUsdRate != null && currencyUsdRate <= 0) {
		throw unprocessable(
			'Le taux de conversion USD doit être supérieur à 0.',
			{
				error: [
					{
						path: ['currencyUsdRate'],
						message: 'Le taux USD doit être supérieur à 0',
					},
				],
			}
		)
	}

	return {
		data: {
			userId,
			number: payload.number,
			title: sanitizeString(payload.title),
			issueDate: payload.issueDate,
			dueDate: payload.dueDate ?? null,
			terms: sanitizeString(payload.terms),
			customerName: payload.customerName,
			customerEmail: sanitizeString(payload.customerEmail),
			customerAddress: sanitizeString(payload.customerAddress),
			shipTo: sanitizeString(payload.shipTo),
		currency: payload.currency,
		subtotal: toDecimal(subtotal),
		taxRate: rawTaxRate != null ? toDecimal(rawTaxRate, 2) : null,
		taxAmount:
			rawTaxRate != null ? toDecimal(computedTaxAmount) : null,
		total: toDecimal(total),
			amountPaid: toDecimal(amountPaid),
			balanceDue: toDecimal(balanceDue),
			notes: sanitizeString(payload.notes),
			additionalTerms: sanitizeString(payload.additionalTerms),
			currencyUsdRate:
				currencyUsdRate != null ? toDecimal(currencyUsdRate, RATE_SCALE) : null,
			exchangeRatesSnapshot: payload.exchangeRatesSnapshot ?? null,
			items: {
				create: items.map((item) => ({
					description: item.description,
					quantity: toDecimal(item.quantity),
					unitCost: toDecimal(item.unitCost),
					amount: toDecimal(item.quantity * item.unitCost),
				})),
			},
		},
		computed: {
			subtotal,
			taxRate: rawTaxRate,
			taxAmount: computedTaxAmount,
			total,
			amountPaid,
			balanceDue,
		},
	}
}

export const prismaDuplicateGuard = (error, field = 'number') => {
	if (error?.code === 'P2002') {
		throw conflict(`Une facture avec ce ${field} existe déjà.`, {
			error: [
				{
					path: [field],
					message: `Une facture avec ce ${field} existe déjà.`,
				},
			],
		})
	}
	throw error
}
