import { z } from 'zod'

const currencyEnum = z.enum(['USD', 'EUR', 'CDF', 'GBP', 'CAD'])

const invoiceItemSchema = z.object({
	id: z.string().uuid().optional(),
	description: z.string().min(1),
	quantity: z.number().nonnegative(),
	unitCost: z.number().nonnegative(),
	amount: z.number().nonnegative().optional(),
})

const isoDateSchema = z
	.string()
	.datetime({ offset: true })
	.transform((value) => new Date(value))

export const invoicePayloadSchema = z.object({
	number: z.string().min(1),
	title: z.string().optional(),
	issueDate: isoDateSchema,
	dueDate: isoDateSchema.optional(),
	terms: z.string().optional(),
	customerName: z.string().min(1),
	customerEmail: z.string().email().optional().or(z.literal('')),
	customerAddress: z.string().optional(),
	shipTo: z.string().optional(),
	currency: currencyEnum,
	subtotal: z.number().nonnegative(),
	taxRate: z.number().min(0).optional(),
	taxAmount: z.number().min(0).optional(),
	total: z.number().nonnegative(),
	amountPaid: z.number().min(0),
	balanceDue: z.number().nonnegative(),
	notes: z.string().optional(),
	additionalTerms: z.string().optional(),
	currencyUsdRate: z.number().min(0).optional(),
	exchangeRatesSnapshot: z.record(z.any()).optional(),
	issuerLegal: z
		.object({
			companyName: z.string().optional(),
			address: z.string().optional(),
			phone: z.string().optional(),
			email: z.string().email().optional(),
			rccm: z.string().optional(),
			idNat: z.string().optional(),
			niu: z.string().optional(),
			taxCentre: z.string().optional(),
			bankName: z.string().optional(),
			bankAccount: z.string().optional(),
			swift: z.string().optional(),
			other: z.string().optional(),
		})
		.optional(),
	items: z.array(invoiceItemSchema).min(1),
})
