import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import useAuth from './useAuth'
import { invoiceApi, profileApi } from '../services/api'
import { loadHistory, saveHistory } from '../utils/storage'
import {
	DEFAULT_CURRENCY_CODE,
	currencyMap,
	currencyOptions,
	fallbackUsdRates,
	getCurrencyMeta,
} from '../constants/currencies'
import { toLocalHistoryEntry } from '../utils/invoice'

const formatInvoiceNumber = (index) => `Fact-${String(index).padStart(4, '0')}`
const toCurrencyNumber = (value) => Number(Number(value || 0).toFixed(2))

const HYDRATION_KEY = 'invoiceItems'
const CUSTOM_RATES_KEY = 'customUsdRates'
const CUSTOM_RATES_UPDATED_AT_KEY = 'customUsdRatesUpdatedAt'
const DEFAULT_CURRENCY_KEY = 'defaultCurrencyCode'
const DEFAULT_CURRENCY_SAVED_AT_KEY = 'defaultCurrencySavedAt'

const parseStoredJson = (raw) => {
	try {
		return JSON.parse(raw)
	} catch {
		return null
	}
}

const normalizeRates = (rates) => {
	const safeRates = { ...fallbackUsdRates, ...rates }
	safeRates.USD = 1
	return safeRates
}

const defaultIssuer = {
	companyName: '',
	address: '',
	phone: '',
	email: '',
	rccm: '',
	idNat: '',
	niu: '',
	taxCentre: '',
	bankName: '',
	bankAccount: '',
	swift: '',
	other: '',
}

const sanitizeIssuer = (issuer) => {
	if (!issuer || typeof issuer !== 'object') return null
	const cleaned = {}
	Object.keys(defaultIssuer).forEach((key) => {
		const value = issuer[key]
		if (value == null) return
		const normalized = String(value).trim()
		if (normalized.length) {
			cleaned[key] = normalized
		}
	})
	return Object.keys(cleaned).length ? cleaned : null
}

export default function useInvoiceBuilder() {
	const { user, setUser } = useAuth()

	const [invoiceNumber, setInvoiceNumber] = useState(() => {
		const history = loadHistory()
		return formatInvoiceNumber(history.length + 1)
	})
	const [logo, setLogo] = useState(null)
	const [defaultCurrencyCode, setDefaultCurrencyCode] = useState(() => {
		const stored = localStorage.getItem(DEFAULT_CURRENCY_KEY)
		return stored && currencyMap[stored] ? stored : DEFAULT_CURRENCY_CODE
	})
	const [currencyCode, setCurrencyCode] = useState(defaultCurrencyCode)
	const [defaultCurrencySavedAt, setDefaultCurrencySavedAt] = useState(
		() => localStorage.getItem(DEFAULT_CURRENCY_SAVED_AT_KEY) || null
	)
	const previousCurrencyCodeRef = useRef(currencyCode)
	const pendingCurrencyHydrationRef = useRef(null)

	const [usdRates, setUsdRates] = useState(() => {
		const stored = localStorage.getItem(CUSTOM_RATES_KEY)
		if (!stored) return fallbackUsdRates
		const parsed = parseStoredJson(stored)
		if (!parsed || typeof parsed !== 'object') return fallbackUsdRates
		return normalizeRates(parsed)
	})
	const [ratesUpdatedAt, setRatesUpdatedAt] = useState(
		() => localStorage.getItem(CUSTOM_RATES_UPDATED_AT_KEY) || null
	)
	const [clientData, setClientData] = useState({
		issuer: '',
		billTo: '',
		shipTo: '',
		email: '',
		address: '',
		clientPhone: '',
		clientEmail: '',
	})
	const [dates, setDates] = useState({
		date: '',
		terms: '',
		dueDate: '',
		poNumber: '',
	})
	const [items, setItems] = useState(() => {
		const stored = localStorage.getItem(HYDRATION_KEY)
		const parsed = parseStoredJson(stored)
		return Array.isArray(parsed) ? parsed : []
	})
const [notesTerms, setNotesTerms] = useState({ notes: '', terms: '' })
const [taxRate, setTaxRate] = useState(0)
const [amountPaid, setAmountPaid] = useState(0)
const [editingIndex, setEditingIndex] = useState(null)
const [history, setHistory] = useState(() => loadHistory())
const [loadingHistory, setLoadingHistory] = useState(false)
const [issuer, setIssuer] = useState(() => {
	const stored = localStorage.getItem('issuerLegalInfo')
	const parsed = parseStoredJson(stored)
	return parsed && typeof parsed === 'object'
		? { ...defaultIssuer, ...parsed }
		: { ...defaultIssuer }
})

	useEffect(() => {
	if (user?.logoUrl && !logo) {
		setLogo(user.logoUrl)
	}
}, [user?.logoUrl, logo])

useEffect(() => {
	localStorage.setItem('issuerLegalInfo', JSON.stringify(issuer))
}, [issuer])

	const currency = useMemo(
		() => getCurrencyMeta(currencyCode),
		[currencyCode]
	)
	const defaultCurrencyMeta = useMemo(
		() => getCurrencyMeta(defaultCurrencyCode),
		[defaultCurrencyCode]
	)

	const convertMoney = useCallback(
		(value, fromCode, toCode) => {
			const numeric = Number(value || 0)
			if (!Number.isFinite(numeric)) return 0

			const fromMeta = getCurrencyMeta(fromCode || DEFAULT_CURRENCY_CODE)
			const toMeta = getCurrencyMeta(toCode || DEFAULT_CURRENCY_CODE)

			const fromRate =
				usdRates[fromMeta.code] ?? fallbackUsdRates[fromMeta.code] ?? 1
			const toRate =
				usdRates[toMeta.code] ?? fallbackUsdRates[toMeta.code] ?? 1

			if (!fromRate || !toRate) return toCurrencyNumber(numeric)

			const usdValue = numeric * fromRate
			const converted = usdValue / toRate
			return toCurrencyNumber(converted)
		},
		[usdRates]
	)

	const syncHistoryFromServer = useCallback(
		async (signal) => {
			if (!user) return null
			setLoadingHistory(true)
			try {
				const limit = 100
				let page = 1
				let done = false
				const collected = []

				while (!done) {
					const data = await invoiceApi.list({
						params: { page, limit },
						signal,
					})
					if (!data) break
					collected.push(...(data.invoices || []))
					const totalPages = data.pagination?.totalPages || 1
					page += 1
					done = page > totalPages
				}

				const mapped = collected.map(toLocalHistoryEntry)
				saveHistory(mapped)
				setHistory(mapped)
				return mapped
			} catch (error) {
				if (error?.name === 'AbortError') return null
				console.error('sync history failed', error)
				return null
			} finally {
				setLoadingHistory(false)
			}
		},
		[user]
	)

	const saveDefaultCurrency = useCallback(() => {
		localStorage.setItem(DEFAULT_CURRENCY_KEY, currencyCode)
		setDefaultCurrencyCode(currencyCode)
		const timestamp = new Date().toISOString()
		setDefaultCurrencySavedAt(timestamp)
		localStorage.setItem(DEFAULT_CURRENCY_SAVED_AT_KEY, timestamp)
	}, [currencyCode])

	const updateCustomRates = useCallback((nextRates) => {
		const normalized = normalizeRates(nextRates)
		const timestamp = new Date().toISOString()
		setUsdRates(normalized)
		setRatesUpdatedAt(timestamp)
		localStorage.setItem(CUSTOM_RATES_KEY, JSON.stringify(normalized))
		localStorage.setItem(CUSTOM_RATES_UPDATED_AT_KEY, timestamp)
	}, [])

	const uploadLogo = useCallback(
		async (dataUrl) => {
			if (!dataUrl) return
			if (!user) {
				setLogo(dataUrl)
				return
			}
			setLogo(dataUrl)
			try {
				const response = await profileApi.uploadLogo({ logo: dataUrl })
				if (response?.logoUrl) {
					setLogo(response.logoUrl)
					setUser((prev) =>
						prev ? { ...prev, logoUrl: response.logoUrl } : prev
					)
				}
			} catch (error) {
				console.error('logo upload failed', error)
				window.alert(
					error?.message ||
						'Impossible de téléverser le logo. L’image reste locale.'
				)
			}
		},
		[user, setUser]
	)

	const subtotal = useMemo(
		() =>
			items.reduce(
				(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
				0
			),
		[items]
	)

	const tax = useMemo(() => (subtotal * Number(taxRate || 0)) / 100, [subtotal, taxRate])
	const total = useMemo(() => subtotal + tax, [subtotal, tax])
	const balanceDue = useMemo(() => total - Number(amountPaid || 0), [total, amountPaid])

	useEffect(() => {
		localStorage.setItem(HYDRATION_KEY, JSON.stringify(items))
	}, [items])

	useEffect(() => {
		const controller = new AbortController()
		if (!user) return () => controller.abort()

		;(async () => {
			const remote = await syncHistoryFromServer(controller.signal)
			if (!remote) return
			if (editingIndex == null) {
				setInvoiceNumber(formatInvoiceNumber(remote.length + 1))
			}
		})()

		return () => controller.abort()
	}, [user, syncHistoryFromServer, editingIndex])

	const hydrateFromHistory = useCallback(
		(index) => {
			if (index == null) return false
			const localHistory = loadHistory()
			const entry = localHistory[index]
			if (!entry) return false

			setEditingIndex(index)
			setInvoiceNumber(entry.number || formatInvoiceNumber(index + 1))

			const nextCurrencyCode =
				entry.currencyCode || entry.currency || DEFAULT_CURRENCY_CODE
			const normalizedCurrencyCode = currencyMap[nextCurrencyCode]
				? nextCurrencyCode
				: DEFAULT_CURRENCY_CODE
			pendingCurrencyHydrationRef.current = normalizedCurrencyCode
			setCurrencyCode(normalizedCurrencyCode)

			setIssuer({ ...defaultIssuer, ...(entry.issuerLegal || {}) })

			setClientData({
				issuer: entry.client?.issuer ?? entry.issuer ?? entry.customer ?? '',
				billTo: entry.client?.billTo ?? entry.billTo ?? entry.customer ?? '',
				shipTo: entry.client?.shipTo ?? entry.shipTo ?? '',
				email: entry.customerEmail ?? entry.customer_email ?? '',
				address: entry.customerAddress ?? entry.customer_address ?? '',
				clientPhone: entry.clientPhone ?? entry.phone ?? '',
				clientEmail: entry.clientEmail ?? entry.email ?? '',
			})

			setDates({
				date: entry.date ?? entry.dates?.date ?? '',
				terms:
					entry.dates?.paymentTerms ??
					entry.paymentTerms ??
					entry.terms ??
					'',
				dueDate: entry.due_date ?? entry.dates?.dueDate ?? '',
				poNumber: entry.poNumber ?? entry.dates?.poNumber ?? '',
			})

			setItems(
				Array.isArray(entry.items)
					? entry.items.map((item, idx) => ({
							id: item.id ?? `${Date.now()}-${idx}`,
							description: item.description ?? '',
							quantity: Number(item.quantity ?? 0),
							rate: Number(item.unit_cost ?? item.rate ?? 0),
					  }))
					: []
			)

			setTaxRate(Number(entry.taxRate ?? entry.tax ?? 0))
			setAmountPaid(Number(entry.amountPaid ?? 0))
			setNotesTerms({
				notes: entry.notes ?? '',
				terms: entry.additionalTerms ?? entry.terms ?? '',
			})

			return true
		},
		[]
	)

	useEffect(() => {
		const previousCode = previousCurrencyCodeRef.current
		if (!previousCode) {
			previousCurrencyCodeRef.current = currencyCode
			return
		}

		if (previousCode === currencyCode) {
			pendingCurrencyHydrationRef.current = null
			return
		}

		if (pendingCurrencyHydrationRef.current === currencyCode) {
			previousCurrencyCodeRef.current = currencyCode
			pendingCurrencyHydrationRef.current = null
			return
		}

		setItems((prevItems) =>
			prevItems.map((item) => {
				const rate = Number(item.rate ?? 0)
				const convertedRate = Number.isFinite(rate)
					? convertMoney(rate, previousCode, currencyCode)
					: rate
				return { ...item, rate: convertedRate }
			})
		)

		setAmountPaid((prev) => {
			const amount = Number(prev ?? 0)
			return Number.isFinite(amount)
				? convertMoney(amount, previousCode, currencyCode)
				: amount
		})

		previousCurrencyCodeRef.current = currencyCode
		pendingCurrencyHydrationRef.current = null
	}, [currencyCode, convertMoney])

	const currencySuffix = currency.symbol || currency.code || ''
	const formatMoney = useCallback(
		(value) => {
			const base = Number(value || 0).toFixed(2).replace('.', ',')
			return currencySuffix ? `${base} ${currencySuffix}` : base
		},
		[currencySuffix]
	)

	const rateSummary = useMemo(
		() =>
			currencyOptions
				.map(({ code }) => {
					const raw =
						usdRates[code] ??
						fallbackUsdRates[code] ??
						(code === 'USD' ? 1 : null)
					const numeric = Number(raw)
					const formatted = Number.isFinite(numeric)
						? numeric.toFixed(4)
						: '—'
					return `${code}: ${formatted}`
				})
				.join(' • '),
		[usdRates]
	)

	const finalizeInvoice = useCallback(
		async ({ onAfterSync } = {}) => {
			const currentHistory = loadHistory()
			const existing =
				editingIndex != null ? currentHistory[editingIndex] : null
			const timestamp = new Date().toISOString()
			const subtotalValue = toCurrencyNumber(subtotal)
			const taxValue = toCurrencyNumber(tax)
			const totalValue = toCurrencyNumber(total)
			const amountPaidValue = toCurrencyNumber(amountPaid)
			const balanceDueValue = toCurrencyNumber(balanceDue)
			const currencyUsdRate =
				usdRates[currency.code] ??
				fallbackUsdRates[currency.code] ??
				1
			const exchangeRatesSnapshot = currencyOptions.reduce(
				(acc, option) => {
					acc[option.code] =
						usdRates[option.code] ??
						fallbackUsdRates[option.code] ??
						null
					return acc
				},
				{}
			)

			const issueDateISO = dates.date
				? new Date(dates.date).toISOString()
				: new Date().toISOString()
			const dueDateISO = dates.dueDate
				? new Date(dates.dueDate).toISOString()
				: undefined
		const customerName = clientData.billTo || clientData.issuer || 'Client'
		const issuerLegalPayload = sanitizeIssuer(issuer)

			const itemsForApi = items.map((item, idx) => ({
				description: item.description || `Item ${idx + 1}`,
				quantity: Number(item.quantity ?? 0),
				unitCost: Number(item.rate ?? 0),
				amount: Number(item.quantity ?? 0) * Number(item.rate ?? 0),
			}))

		const invoicePayload = {
			number: invoiceNumber,
			title: undefined,
			issueDate: issueDateISO,
			dueDate: dueDateISO,
			terms: dates.terms?.trim() || undefined,
			customerName,
			customerEmail: clientData.email?.trim() || undefined,
			customerAddress: clientData.address?.trim() || undefined,
			shipTo: clientData.shipTo?.trim() || undefined,
			clientPhone: clientData.clientPhone?.trim() || undefined,
			clientContactEmail: clientData.clientEmail?.trim() || undefined,
			currency: currency.code,
				subtotal: subtotalValue,
				taxRate,
				taxAmount: taxValue,
				total: totalValue,
				amountPaid: amountPaidValue,
				balanceDue: balanceDueValue,
				notes: notesTerms.notes?.trim() || undefined,
				additionalTerms: notesTerms.terms?.trim() || undefined,
				currencyUsdRate,
			exchangeRatesSnapshot,
		issuerLegal: issuerLegalPayload || undefined,
			items: itemsForApi,
		}

			const itemsForLocal = items.map((item, idx) => ({
				id: String(item.id ?? `${Date.now()}-${idx}`),
				description: item.description || `Item ${idx + 1}`,
				quantity: Number(item.quantity ?? 0),
				unit_cost: Number(item.rate ?? 0),
			}))

			let remoteHistory = null
			try {
				if (existing?.id) {
					await invoiceApi.update(existing.id, invoicePayload)
				} else {
					await invoiceApi.create(invoicePayload)
				}
				remoteHistory = await syncHistoryFromServer()
			} catch (error) {
				console.error('remote invoice sync failed', error)
				let message =
					error?.message ||
					'Impossible de sauvegarder la facture sur le serveur. Elle reste stockée en local.'
				if (Array.isArray(error?.payload?.error)) {
					message = error.payload.error
						.map((issue) => {
							const path = Array.isArray(issue.path)
								? issue.path.join('.')
								: ''
							return path ? `${path}: ${issue.message}` : issue.message
						})
						.join('\n')
				}
				window.alert(message)
			}

			if (remoteHistory) {
				if (editingIndex != null) {
					setEditingIndex(null)
					setInvoiceNumber(invoicePayload.number)
				} else {
					setInvoiceNumber(formatInvoiceNumber(remoteHistory.length + 1))
				}
				onAfterSync?.(remoteHistory)
				return
			}

			if (existing) {
			currentHistory[editingIndex] = {
				...existing,
				...invoicePayload,
				date: invoicePayload.issueDate
					? invoicePayload.issueDate.slice(0, 10)
					: '',
				due_date: invoicePayload.dueDate
					? invoicePayload.dueDate.slice(0, 10)
					: '',
				items: itemsForLocal,
				total: totalValue,
				amountPaid: amountPaidValue,
				balanceDue: balanceDueValue,
				issuerLegal: issuerLegalPayload || existing.issuerLegal || null,
				clientPhone: clientData.clientPhone ?? '',
				clientEmail: clientData.clientEmail ?? '',
				updatedAt: timestamp,
				createdAt: existing.createdAt ?? timestamp,
			}
			} else {
			currentHistory.push({
				id: `${Date.now()}`,
				...invoicePayload,
				date: invoicePayload.issueDate
					? invoicePayload.issueDate.slice(0, 10)
					: '',
				due_date: invoicePayload.dueDate
					? invoicePayload.dueDate.slice(0, 10)
					: '',
				items: itemsForLocal,
				total: totalValue,
				amountPaid: amountPaidValue,
				balanceDue: balanceDueValue,
				issuerLegal: issuerLegalPayload || null,
				clientPhone: clientData.clientPhone ?? '',
				clientEmail: clientData.clientEmail ?? '',
				createdAt: timestamp,
				updatedAt: timestamp,
			})
				setInvoiceNumber(formatInvoiceNumber(currentHistory.length + 1))
			}

			saveHistory(currentHistory)
			setHistory(currentHistory)
			onAfterSync?.(currentHistory)
		},
		[
			editingIndex,
			subtotal,
			tax,
			total,
		amountPaid,
		balanceDue,
		usdRates,
		currency.code,
		dates,
		clientData,
		items,
		invoiceNumber,
		taxRate,
		notesTerms,
		syncHistoryFromServer,
		issuer,
	]
)

	return {
		state: {
			invoiceNumber,
			logo,
			currencyCode,
			defaultCurrencyCode,
			defaultCurrencySavedAt,
			usdRates,
			ratesUpdatedAt,
			clientData,
			dates,
			items,
		notesTerms,
		taxRate,
		amountPaid,
		editingIndex,
		history,
		loadingHistory,
		issuer,
		},
		derived: {
			currency,
			defaultCurrencyMeta,
			currencyOptions,
			subtotal,
			tax,
			total,
			balanceDue,
			formatMoney,
			rateSummary,
		},
		actions: {
			setInvoiceNumber,
			setLogo,
			setCurrencyCode,
			saveDefaultCurrency,
		updateCustomRates,
		uploadLogo,
		setClientData,
		setIssuer,
		setDates,
			setItems,
			setNotesTerms,
			setTaxRate,
			setAmountPaid,
			setEditingIndex,
			syncHistoryFromServer,
			hydrateFromHistory,
			finalizeInvoice,
		},
		utils: {
			convertMoney,
		},
	}
}
