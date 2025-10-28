import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'node:path'

import authRoutes from './routes/auth.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'
import profileRoutes from './routes/profile.routes.js'
import { corsOptions, helmetOptions } from './config/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()
const uploadsDir = path.resolve(process.cwd(), 'uploads')

app.disable('x-powered-by')
app.use(helmet(helmetOptions))
app.use(cors(corsOptions))
app.use(morgan('dev'))
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/profile', profileRoutes)

app.use((req, res) => {
	res.status(404).json({ error: `Route ${req.path} introuvable` })
})

app.use(errorHandler)

export default app
