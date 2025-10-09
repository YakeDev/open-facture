import { verifyToken, getTokenFromRequest } from '../utils/token.js'
import prisma from '../lib/prisma.js'

export const requireAuth = async (req, res, next) => {
	try {
		const token = getTokenFromRequest(req)
		if (!token) {
			return res.status(401).json({ error: 'Authentication required' })
		}

		const decoded = verifyToken(token)
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { id: true, role: true },
		})

		if (!user) {
			return res.status(401).json({ error: 'Invalid or expired token' })
		}

		req.user = user
		return next()
	} catch (error) {
		console.warn('auth error', error.message)
		return res.status(401).json({ error: 'Invalid or expired token' })
	}
}
