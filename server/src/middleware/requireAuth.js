import {
	verifyToken,
	getTokenFromRequest,
	clearAuthCookie,
} from '../utils/token.js'
import prisma from '../lib/prisma.js'
import { unauthorized } from '../utils/httpError.js'

export const requireAuth = async (req, res, next) => {
	try {
		const token = getTokenFromRequest(req)
		if (!token) {
			throw unauthorized('Authentification requise')
		}

		const decoded = verifyToken(token)
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { id: true, role: true, tokenVersion: true },
		})

		if (!user || user.tokenVersion !== decoded.tokenVersion) {
			clearAuthCookie(res)
			throw unauthorized('Jeton invalide ou expiré')
		}

		req.user = user
		return next()
	} catch (error) {
		if (
			error?.name === 'TokenExpiredError' ||
			error?.name === 'JsonWebTokenError'
		) {
			clearAuthCookie(res)
			return next(unauthorized('Jeton invalide ou expiré'))
		}
		return next(error)
	}
}
