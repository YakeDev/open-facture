import { Router } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { invoicePayloadSchema } from '../schemas/invoice.js'
import {
	buildInvoiceData,
	mapInvoice,
	mapInvoices,
	prismaDuplicateGuard,
} from '../lib/invoice.js'
import { forbidden, notFound } from '../utils/httpError.js'

const router = Router()

const parsePagination = (query) => {
	const rawPage = Number.parseInt(query.page, 10)
	const rawLimit = Number.parseInt(query.limit, 10)

	const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
	const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 20

	return {
		page,
		limit: Math.min(limit, 100),
		skip: (page - 1) * Math.min(limit, 100),
	}
}

const isAdmin = (user) => user.role === 'admin'

router.use(requireAuth)

router.get('/summary', async (req, res, next) => {
	try {
		const where = isAdmin(req.user) ? {} : { userId: req.user.id }
		const [aggregate, recent] = await Promise.all([
			prisma.invoice.aggregate({
				where,
				_count: { _all: true },
				_sum: {
					total: true,
					amountPaid: true,
					balanceDue: true,
				},
			}),
			prisma.invoice.findMany({
				where,
				orderBy: { issueDate: 'desc' },
				take: 5,
				select: {
					id: true,
					number: true,
					customerName: true,
					issueDate: true,
					total: true,
					balanceDue: true,
					currency: true,
				},
			}),
		])

		const summary = {
			totalInvoices: aggregate._count?._all || 0,
			totalAmount: Number(aggregate._sum?.total || 0),
			totalPaid: Number(aggregate._sum?.amountPaid || 0),
			totalOutstanding: Number(aggregate._sum?.balanceDue || 0),
			recent: recent.map((invoice) => ({
				...invoice,
				total: Number(invoice.total || 0),
				balanceDue: Number(invoice.balanceDue || 0),
			})),
		}

		return res.json({ summary })
	} catch (error) {
		return next(error)
	}
})

router.get('/', async (req, res, next) => {
	try {
		const { page, limit, skip } = parsePagination(req.query)
		const where = isAdmin(req.user) ? {} : { userId: req.user.id }

		const [invoices, totalCount] = await Promise.all([
			prisma.invoice.findMany({
				where,
				orderBy: { issueDate: 'desc' },
				include: { items: true },
				skip,
				take: limit,
			}),
			prisma.invoice.count({ where }),
		])

		return res.json({
			invoices: mapInvoices(invoices),
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit) || 1,
			},
		})
	} catch (error) {
		return next(error)
	}
})

router.post('/', async (req, res, next) => {
	try {
		const payload = invoicePayloadSchema.parse(req.body)
		const { data } = buildInvoiceData(payload, req.user.id)

		const invoice = await prisma.invoice.create({
			data,
			include: { items: true },
		})

		return res.status(201).json({ invoice: mapInvoice(invoice) })
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			try {
				prismaDuplicateGuard(error, 'number')
			} catch (guardError) {
				return next(guardError)
			}
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
			throw notFound('Facture introuvable.')
		}

		if (!isAdmin(req.user) && invoice.userId !== req.user.id) {
			throw forbidden('Accès refusé.')
		}

		return res.json({ invoice: mapInvoice(invoice) })
	} catch (error) {
		return next(error)
	}
})

router.put('/:id', async (req, res, next) => {
	try {
		const payload = invoicePayloadSchema.parse(req.body)
		const existing = await prisma.invoice.findUnique({
			where: { id: req.params.id },
		})

		if (!existing) {
			throw notFound('Facture introuvable.')
		}

		if (!isAdmin(req.user) && existing.userId !== req.user.id) {
			throw forbidden('Accès refusé.')
		}

	const { data } = buildInvoiceData(payload, existing.userId)
	const { items, ...updateData } = data
	delete updateData.userId

		const updated = await prisma.$transaction(async (tx) => {
			await tx.invoiceItem.deleteMany({
				where: { invoiceId: existing.id },
			})

			return tx.invoice.update({
				where: { id: existing.id },
				data: {
					...updateData,
					items,
				},
				include: { items: true },
			})
		})

		return res.json({ invoice: mapInvoice(updated) })
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			try {
				prismaDuplicateGuard(error, 'number')
			} catch (guardError) {
				return next(guardError)
			}
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
			throw notFound('Facture introuvable.')
		}

		if (!isAdmin(req.user) && invoice.userId !== req.user.id) {
			throw forbidden('Accès refusé.')
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
