export const currencyOptions = [
	{ code: 'USD', label: 'USD ($)', symbol: '$', fallbackUsdRate: 1 },
	{ code: 'EUR', label: 'EUR (€)', symbol: '€', fallbackUsdRate: 1.08 },
	{ code: 'CDF', label: 'CDF (FC)', symbol: 'FC', fallbackUsdRate: 0.00035 },
	{ code: 'GBP', label: 'GBP (£)', symbol: '£', fallbackUsdRate: 1.27 },
	{ code: 'CAD', label: 'CAD ($)', symbol: '$', fallbackUsdRate: 0.74 },
]

export const DEFAULT_CURRENCY_CODE = 'USD'

export const currencyMap = currencyOptions.reduce((acc, option) => {
	acc[option.code] = option
	return acc
}, {})

export const fallbackUsdRates = currencyOptions.reduce((acc, option) => {
	acc[option.code] = option.fallbackUsdRate
	return acc
}, {})

export const getCurrencyMeta = (code) =>
	currencyMap[code] || currencyMap[DEFAULT_CURRENCY_CODE]
