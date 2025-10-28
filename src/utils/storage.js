// src/utils/storage.js
export const loadHistory = () => {
	const raw = localStorage.getItem('invoicesHistory')
	if (!raw) return []
	try {
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? parsed : []
	} catch (error) {
		console.warn('Impossible de lire invoicesHistory, réinitialisation.', error)
		localStorage.removeItem('invoicesHistory')
		return []
	}
}

export const saveHistory = (history) => {
	localStorage.setItem('invoicesHistory', JSON.stringify(history))
}

export const addInvoiceToHistory = (invoice, index) => {
	const history = loadHistory()
	if (typeof index === 'number' && index >= 0 && index < history.length) {
		history[index] = invoice
	} else {
		history.push(invoice)
	}
	saveHistory(history)
	return history
}

export const clearHistory = () => {
	localStorage.removeItem('invoicesHistory')
}
