/* eslint-env node */
/* eslint-disable no-undef */
import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30_000,
	retries: process.env.CI ? 2 : 0,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
		headless: true,
		trace: 'retain-on-failure',
	},
	webServer: process.env.PLAYWRIGHT_WEB_SERVER
		? undefined
		: {
			command: 'npm run dev',
			cwd: process.cwd(),
			port: 5173,
			reuseExistingServer: true,
			timeout: 120_000,
		},
})
