import { Router } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
	badRequest,
	unprocessable,
} from '../utils/httpError.js'

const uploadsDir = path.resolve(process.cwd(), 'uploads')

const SUPPORTED_MIME_TYPES = new Set([
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
	'image/svg+xml',
])

const router = Router()

router.use(requireAuth)

router.post('/logo', async (req, res, next) => {
	try {
		const { logo } = req.body
		if (!logo || typeof logo !== 'string') {
			throw badRequest('Logo manquant.')
		}

		const matches = logo.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
		if (!matches) {
			throw badRequest('Format de logo invalide.')
		}

		const mimeType = matches[1]
		if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
			throw unprocessable('Format d’image non supporté.', {
				error: [
					{
						path: ['logo'],
						message: 'Formats acceptés: PNG, JPG, WEBP, SVG.',
					},
				],
			})
		}

		const base64 = matches[2]
		const buffer = Buffer.from(base64, 'base64')
		const maxSize = 1024 * 1024 * 2 // 2MB
		if (buffer.length > maxSize) {
			throw unprocessable('Le fichier dépasse 2 Mo.', {
				error: [
					{
						path: ['logo'],
						message: 'Le fichier ne doit pas dépasser 2 Mo.',
					},
				],
			})
		}

		await fs.mkdir(uploadsDir, { recursive: true })

		const extension = mimeType.split('/')[1] || 'png'
		const fileName = `${req.user.id}-${Date.now()}-${crypto.randomUUID()}.${extension}`
		const filePath = path.join(uploadsDir, fileName)
		await fs.writeFile(filePath, buffer)

		const previous = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: { logoUrl: true },
		})

		if (previous?.logoUrl?.startsWith('/uploads/')) {
			const oldPath = path.join(uploadsDir, previous.logoUrl.replace('/uploads/', ''))
			fs.unlink(oldPath).catch(() => {})
		}

		const publicPath = `/uploads/${fileName}`
		await prisma.user.update({
			where: { id: req.user.id },
			data: { logoUrl: publicPath },
		})

		const baseUrl = `${req.protocol}://${req.get('host')}`
		return res.json({ logoUrl: `${baseUrl}${publicPath}` })
	} catch (error) {
		return next(error)
	}
})

export default router
