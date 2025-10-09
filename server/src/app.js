import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(
	cors({
		origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
		credentials: true,
	})
)
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)

app.use((req, res) => {
	res.status(404).json({ error: `Route ${req.path} introuvable` })
})

app.use((err, _req, res) => {
	console.error(err)
	res.status(500).json({ error: "Une erreur est survenue, veuillez réessayer." })
})

export default app
