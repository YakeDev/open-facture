import { env, isProduction } from './env.js'

const allowedOrigins = new Set(
	(env.ALLOWED_ORIGINS || '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean)
)

if (env.CLIENT_ORIGIN) {
	allowedOrigins.add(env.CLIENT_ORIGIN)
}

export const corsOptions = {
	origin(origin, callback) {
		if (!origin || allowedOrigins.has(origin)) {
			return callback(null, origin || env.CLIENT_ORIGIN)
		}
		return callback(new Error(`Origin ${origin} non autorisée`))
	},
	credentials: true,
}

const sameSite = env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')
const secure = env.COOKIE_SECURE ?? isProduction

export const cookieOptions = {
	httpOnly: true,
	secure,
	sameSite,
	maxAge: 1000 * 60 * 60 * 24 * 7,
}

export const helmetOptions = isProduction
	? {
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					'default-src': ["'self'"],
					'img-src': ["'self'", 'data:', 'blob:'],
					'script-src': ["'self'"],
					'style-src': ["'self'", "'unsafe-inline'"],
				},
			},
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: { policy: 'cross-origin' },
	  }
	: {
			contentSecurityPolicy: false,
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: { policy: 'cross-origin' },
	  }
