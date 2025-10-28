/* eslint-env node */
/* eslint-disable no-undef */
import { expect, test } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_EMAIL || `e2e-${Date.now()}@example.com`
const TEST_PASSWORD = process.env.E2E_PASSWORD || 'Password123!'

test.beforeEach(async ({ context }) => {
	await context.clearCookies()
})

const register = async (page) => {
	await page.goto('/register')
	await page.fill('input[name="name"]', 'E2E User')
	await page.fill('input[name="email"]', TEST_EMAIL)
	await page.fill('input[name="password"]', TEST_PASSWORD)
	await page.selectOption('select[name="defaultCurrency"]', 'USD')
	await page.click('button[type="submit"]')
	await page.waitForURL('**/', { timeout: 45_000 })
}

const ensureLoggedOut = async (page) => {
	await page.goto('/')
	if (page.url().includes('/login')) {
		return
	}
	const logoutButton = page.locator('text=Se déconnecter')
	if (await logoutButton.count()) {
		await Promise.all([
			page.waitForURL('**/login'),
			logoutButton.first().click(),
		])
	}
}

test.describe.serial('Authentication flow', () => {
	test('redirects anonymous users to login', async ({ page }) => {
		await page.goto('/')
		await page.waitForURL('**/login')
		expect(page.url()).toMatch(/\/login$/)
	})

	test('allows a user to register then access the builder', async ({ page }) => {
		await ensureLoggedOut(page)
		await register(page)
		expect(page.url()).toMatch(/\/$/)
		expect(await page.locator('text=Open Facture').count()).toBeGreaterThan(0)
	})
})
