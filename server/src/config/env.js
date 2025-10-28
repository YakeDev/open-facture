import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173'

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(4000),
	DATABASE_URL: z.string().min(1, 'DATABASE_URL est requis'),
	JWT_SECRET: z
		.string()
		.min(32, 'JWT_SECRET doit contenir au moins 32 caractères'),
	CLIENT_ORIGIN: z
		.string()
		.url()
		.default(DEFAULT_CLIENT_ORIGIN),
	ALLOWED_ORIGINS: z.string().optional(),
	COOKIE_SECURE: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.optional(),
	COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
})

const resolvedJwtSecret =
	process.env.JWT_SECRET ||
	(process.env.NODE_ENV === 'development'
		? 'dev-secret-change-me-dev-secret-change-me!!'
		: undefined)

export const env = envSchema.parse({
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	DATABASE_URL: process.env.DATABASE_URL,
	JWT_SECRET: resolvedJwtSecret,
	CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
	ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
	COOKIE_SECURE: process.env.COOKIE_SECURE,
	COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
})

export const isProduction = env.NODE_ENV === 'production'

if (!process.env.JWT_SECRET && env.NODE_ENV === 'development') {
	console.warn(
		'⚠️  JWT_SECRET non défini, utilisation du secret de développement par défaut.'
	)
}
