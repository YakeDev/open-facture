import { z } from 'zod'

export const registerSchema = z.object({
	name: z.string().min(1).max(120).optional(),
	email: z.string().email(),
	password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
	defaultCurrency: z.enum(['USD', 'EUR', 'CDF', 'GBP', 'CAD']).optional(),
})

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})
