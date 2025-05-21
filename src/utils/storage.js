// src/utils/storage.js
export const loadHistory = () => {
	const raw = localStorage.getItem('invoicesHistory')
	return raw ? JSON.parse(raw) : []
}

export const saveHistory = (history) => {
	localStorage.setItem('invoicesHistory', JSON.stringify(history))
}

export const addInvoiceToHistory = (invoice) => {
	const history = loadHistory()
	history.push(invoice)
	saveHistory(history)
}

export const clearHistory = () => {
	localStorage.removeItem('invoicesHistory')
}
