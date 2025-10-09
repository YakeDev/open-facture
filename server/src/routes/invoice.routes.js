import { Router } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { invoicePayloadSchema } from '../schemas/invoice.js'

const router = Router()

const toDecimal = (value) => new Prisma.Decimal(value ?? 0)

const mapInvoice = (invoice) => ({
	...invoice,
	subtotal: Number(invoice.subtotal),
	taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
	taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : null,
	total: Number(invoice.total),
	amountPaid: Number(invoice.amountPaid),
	balanceDue: Number(invoice.balanceDue),
	items: invoice.items.map((item) => ({
		...item,
		quantity: Number(item.quantity),
		unitCost: Number(item.unitCost),
		amount: Number(item.amount),
	})),
	currencyUsdRate: invoice.currencyUsdRate
		? Number(invoice.currencyUsdRate)
		: null,
})

router.use(requireAuth)

router.get('/', async (req, res, next) => {
	try {
		const where = req.user.role === 'admin' ? {} : { userId: req.user.id }
		const invoices = await prisma.invoice.findMany({
			where,
			orderBy: { issueDate: 'desc' },
			include: { items: true },
		})
		return res.json({ invoices: invoices.map(mapInvoice) })
	} catch (error) {
		return next(error)
	}
})

router.post('/', async (req, res, next) => {
	try {
		const payload = invoicePayloadSchema.parse(req.body)

		const invoice = await prisma.invoice.create({
			data: {
				userId: req.user.id,
				number: payload.number,
				title: payload.title,
				issueDate: payload.issueDate,
				dueDate: payload.dueDate,
				terms: payload.terms,
				customerName: payload.customerName,
				customerEmail: payload.customerEmail || null,
				customerAddress: payload.customerAddress,
				shipTo: payload.shipTo,
				currency: payload.currency,
				subtotal: toDecimal(payload.subtotal),
				taxRate:
					typeof payload.taxRate === 'number'
						? toDecimal(payload.taxRate)
						: null,
				taxAmount:
					typeof payload.taxAmount === 'number'
						? toDecimal(payload.taxAmount)
						: null,
				total: toDecimal(payload.total),
				amountPaid: toDecimal(payload.amountPaid),
				balanceDue: toDecimal(payload.balanceDue),
				notes: payload.notes,
				additionalTerms: payload.additionalTerms,
				currencyUsdRate:
					typeof payload.currencyUsdRate === 'number'
						? toDecimal(payload.currencyUsdRate)
						: null,
				exchangeRatesSnapshot: payload.exchangeRatesSnapshot ?? null,
				items: {
					create: payload.items.map((item) => ({
						description: item.description,
						quantity: toDecimal(item.quantity),
						unitCost: toDecimal(item.unitCost),
						amount: toDecimal(
							item.amount ?? item.quantity * item.unitCost
						),
					})),
				},
			},
			include: { items: true },
		})

		return res.status(201).json({ invoice: mapInvoice(invoice) })
	} catch (error) {
		if (error.name === 'ZodError') {
			return res.status(400).json({ error: error.issues })
		}
		return next(error)
	}
})

router.get('/:id', async (req, res, next) => {
	try {
		const invoice = await prisma.invoice.findUnique({
			where: { id: req.params.id },
			include: { items: true },
		})

		if (!invoice) {
			return res.status(404).json({ error: 'Facture introuvable.' })
		}

		if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
			return res.status(403).json({ error: 'Accès refusé.' })
		}

		return res.json({ invoice: mapInvoice(invoice) })
	} catch (error) {
		return next(error)
	}
})

router.put('/:id', async (req, res, next) => {
	try {
		const payload = invoicePayloadSchema.parse(req.body)

	const invoice = await prisma.invoice.findUnique({
		where: { id: req.params.id },
		include: { items: true },
	})

	if (!invoice) {
		return res.status(404).json({ error: 'Facture introuvable.' })
	}

	if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
		return res.status(403).json({ error: 'Accès refusé.' })
	}

		const updated = await prisma.$transaction(async (tx) => {
			await tx.invoiceItem.deleteMany({
				where: { invoiceId: invoice.id },
			})

			return tx.invoice.update({
				where: { id: invoice.id },
				data: {
					number: payload.number,
					title: payload.title,
					issueDate: payload.issueDate,
					dueDate: payload.dueDate,
					terms: payload.terms,
					customerName: payload.customerName,
					customerEmail: payload.customerEmail || null,
					customerAddress: payload.customerAddress,
					shipTo: payload.shipTo,
					currency: payload.currency,
					subtotal: toDecimal(payload.subtotal),
					taxRate:
						typeof payload.taxRate === 'number'
							? toDecimal(payload.taxRate)
							: null,
					taxAmount:
						typeof payload.taxAmount === 'number'
							? toDecimal(payload.taxAmount)
							: null,
					total: toDecimal(payload.total),
					amountPaid: toDecimal(payload.amountPaid),
					balanceDue: toDecimal(payload.balanceDue),
					notes: payload.notes,
					additionalTerms: payload.additionalTerms,
					currencyUsdRate:
						typeof payload.currencyUsdRate === 'number'
							? toDecimal(payload.currencyUsdRate)
							: null,
					exchangeRatesSnapshot: payload.exchangeRatesSnapshot ?? null,
					items: {
						create: payload.items.map((item) => ({
							description: item.description,
							quantity: toDecimal(item.quantity),
							unitCost: toDecimal(item.unitCost),
							amount: toDecimal(
								item.amount ?? item.quantity * item.unitCost
							),
						})),
					},
				},
				include: { items: true },
			})
		})

		return res.json({ invoice: mapInvoice(updated) })
	} catch (error) {
		if (error.name === 'ZodError') {
			return res.status(400).json({ error: error.issues })
		}
		return next(error)
	}
})

router.delete('/:id', async (req, res, next) => {
	try {
		const invoice = await prisma.invoice.findUnique({
			where: { id: req.params.id },
		})

		if (!invoice) {
			return res.status(404).json({ error: 'Facture introuvable.' })
		}

		if (req.user.role !== 'admin' && invoice.userId !== req.user.id) {
			return res.status(403).json({ error: 'Accès refusé.' })
		}

		await prisma.invoice.delete({
			where: { id: invoice.id },
		})

		return res.status(204).send()
	} catch (error) {
		return next(error)
	}
})

export default router
