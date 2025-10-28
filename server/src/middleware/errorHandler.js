import { isProduction } from '../config/index.js'
import { HttpError } from '../utils/httpError.js'

export const errorHandler = (err, _req, res, _next) => {
 void _next
	const error = err instanceof HttpError ? err : normalizeError(err)
	const status = error.status || 500

	if (!isProduction) {
		console.error(err)
	} else if (status >= 500) {
		console.error(err.message)
	}

	const payload = buildPayload(error, status)
	res.status(status).json(payload)
}

const normalizeError = (err) => {
	if (err?.name === 'ZodError') {
		return new HttpError(400, 'Requête invalide', { error: err.issues })
	}
	return new HttpError(err?.status || 500, err?.message || 'Erreur serveur')
}

const buildPayload = (error, status) => {
	if (error.payload) {
		return error.payload
	}

	if (error.status === 400 && error.message === 'Requête invalide') {
		return { error: error.payload?.error || 'Requête invalide' }
	}

	const message =
		status >= 500
			? "Une erreur est survenue, veuillez réessayer."
			: error.message || 'Erreur'

	const payload = { error: message }

	if (!isProduction && status >= 500) {
		payload.trace = error.stack
	}

	return payload
}
