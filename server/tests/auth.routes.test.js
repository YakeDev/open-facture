import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = {
	user: {
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
	},
	invoice: {
		aggregate: vi.fn(),
		findMany: vi.fn(),
		count: vi.fn(),
	},
	$transaction: vi.fn(async (callback) => callback(prismaMock)),
}

vi.mock('../src/lib/prisma.js', () => ({
	default: prismaMock,
}))

const appPromise = import('../src/app.js').then((module) => module.default)

const userFixture = {
	id: 'user-1',
	email: 'test@example.com',
	name: 'Test',
	role: 'employee',
	defaultCurrency: 'USD',
	logoUrl: null,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	tokenVersion: 0,
}

const resetMocks = () => {
	Object.values(prismaMock.user).forEach((fn) => fn.mockReset?.())
	Object.values(prismaMock.invoice).forEach((fn) => fn.mockReset?.())
	prismaMock.$transaction.mockReset()
	prismaMock.$transaction.mockImplementation(async (callback) =>
		callback(prismaMock)
	)
}

beforeEach(() => {
	resetMocks()
})

describe('Auth routes', () => {
	it('registers a new user and returns a session cookie', async () => {
		const app = await appPromise
		prismaMock.user.findUnique
			.mockResolvedValueOnce(null) // uniqueness check
			.mockResolvedValue(userFixture)
		prismaMock.user.create.mockResolvedValueOnce(userFixture)

		const response = await request(app).post('/api/auth/register').send({
			email: 'test@example.com',
			password: 'Password123!',
			defaultCurrency: 'USD',
		})

		expect(response.status).toBe(201)
		expect(response.body).toHaveProperty('user.email', 'test@example.com')

		const cookie = response.header['set-cookie']
		expect(cookie).toBeDefined()
		expect(prismaMock.user.create).toHaveBeenCalledTimes(1)
	})

	it('rejects duplicate registration', async () => {
		const app = await appPromise
		prismaMock.user.findUnique.mockResolvedValueOnce(userFixture)

		const response = await request(app).post('/api/auth/register').send({
			email: 'test@example.com',
			password: 'Password123!',
		})

		expect(response.status).toBe(409)
		expect(response.body).toHaveProperty('error')
	})
})

describe('Invoice protected routes', () => {
	const buildCookie = async () => {
		const app = await appPromise
		prismaMock.user.findUnique
			.mockResolvedValueOnce(null) // register uniqueness
			.mockResolvedValue(userFixture) // for auth checks
		prismaMock.user.create.mockResolvedValueOnce(userFixture)

		const registerResponse = await request(app).post('/api/auth/register').send({
			email: 'test@example.com',
			password: 'Password123!',
			defaultCurrency: 'USD',
		})

		return registerResponse.headers['set-cookie']
	}

	it('requires authentication', async () => {
		const app = await appPromise
		const response = await request(app).get('/api/invoices/summary')
		expect(response.status).toBe(401)
	})

	it('returns invoice summary for authenticated user', async () => {
		const cookie = await buildCookie()
		const app = await appPromise

		prismaMock.invoice.aggregate.mockResolvedValue({
			_count: { _all: 2 },
			_sum: { total: 200, amountPaid: 150, balanceDue: 50 },
		})
		prismaMock.invoice.findMany.mockResolvedValue([
			{
				id: 'inv-1',
				userId: 'user-1',
				number: 'Fact-0001',
				issueDate: '2024-01-01T00:00:00.000Z',
				customerName: 'Client 1',
				total: 150,
				balanceDue: 50,
				amountPaid: 100,
				subtotal: 120,
				taxRate: 5,
				taxAmount: 30,
				currency: 'USD',
				items: [],
			},
		])
		prismaMock.invoice.count.mockResolvedValue(2)

		const response = await request(app)
			.get('/api/invoices/summary')
			.set('Cookie', cookie)

		expect(response.status).toBe(200)
		expect(response.body.summary.totalInvoices).toBe(2)
		expect(response.body.summary.totalAmount).toBe(200)
		expect(prismaMock.invoice.aggregate).toHaveBeenCalled()
	})
})
