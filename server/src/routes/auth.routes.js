import { Router } from 'express'
import bcrypt from 'bcrypt'
import prisma from '../lib/prisma.js'
import {
	createToken,
	setAuthCookie,
	clearAuthCookie,
	getTokenFromRequest,
	verifyToken,
} from '../utils/token.js'
import { registerSchema, loginSchema } from '../schemas/auth.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { invalidateUserSessions } from '../lib/auth.js'

const router = Router()

const mapUser = (user) => ({
	id: user.id,
	email: user.email,
	name: user.name,
	role: user.role,
	defaultCurrency: user.defaultCurrency,
	logoUrl: user.logoUrl,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
})

router.post('/register', async (req, res) => {
	try {
		const payload = registerSchema.parse(req.body)

		const existing = await prisma.user.findUnique({
			where: { email: payload.email },
		})

		if (existing) {
			return res.status(409).json({ error: 'Un compte existe déjà.' })
		}

		const passwordHash = await bcrypt.hash(payload.password, 12)

		const user = await prisma.user.create({
			data: {
				email: payload.email,
				passwordHash,
				name: payload.name,
				defaultCurrency: payload.defaultCurrency,
				role: 'employee',
			},
		})

			const token = createToken({
				userId: user.id,
				tokenVersion: user.tokenVersion,
			})
			setAuthCookie(res, token)

		return res.status(201).json({ user: mapUser(user) })
	} catch (error) {
		if (error.name === 'ZodError') {
			return res.status(400).json({ error: error.issues })
		}
		console.error('register error', error)
		return res.status(500).json({ error: 'Inscription impossible pour le moment.' })
	}
})

router.post('/login', async (req, res) => {
	try {
		const payload = loginSchema.parse(req.body)

		const user = await prisma.user.findUnique({
			where: { email: payload.email },
		})

		if (!user) {
			return res.status(401).json({ error: 'Identifiants invalides.' })
		}

		const valid = await bcrypt.compare(payload.password, user.passwordHash)

		if (!valid) {
			return res.status(401).json({ error: 'Identifiants invalides.' })
		}

			const token = createToken({
				userId: user.id,
				tokenVersion: user.tokenVersion,
			})
		setAuthCookie(res, token)

		return res.json({ user: mapUser(user) })
	} catch (error) {
		if (error.name === 'ZodError') {
			return res.status(400).json({ error: error.issues })
		}
		console.error('login error', error)
		return res.status(500).json({ error: 'Connexion impossible pour le moment.' })
	}
})

router.post('/logout', async (req, res) => {
	const token = getTokenFromRequest(req)
	if (token) {
	try {
		const decoded = verifyToken(token)
		await invalidateUserSessions(decoded.userId)
	} catch {
		// ignore invalid token
	}
	}
	clearAuthCookie(res)
	return res.status(204).send()
})

router.get('/me', requireAuth, async (req, res) => {
	const user = await prisma.user.findUnique({
		where: { id: req.user.id },
	})

	if (!user) {
		clearAuthCookie(res)
		return res.status(401).json({ error: 'Utilisateur introuvable.' })
	}

	return res.json({ user: mapUser(user) })
})

export default router
