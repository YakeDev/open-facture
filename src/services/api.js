const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const request = async (path, { method = 'GET', body, headers, ...rest } = {}) => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include',
		...rest,
	})

	if (!response.ok) {
		let errorPayload = null
		try {
			errorPayload = await response.json()
		} catch {
			// ignore
		}

		let message =
			errorPayload?.error ||
			errorPayload?.message ||
			`API error (${response.status})`

		if (Array.isArray(errorPayload?.error)) {
			message = errorPayload.error
				.map((issue) => {
					const path = Array.isArray(issue.path) ? issue.path.join('.') : ''
					return path ? `${path}: ${issue.message}` : issue.message
				})
				.join('\n')
		}

		const apiError = new Error(message)
		apiError.status = response.status
		apiError.payload = errorPayload
		throw apiError
	}

	try {
		return await response.json()
	} catch {
		return null
	}
}

export const authApi = {
	register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
	login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
	logout: () => request('/auth/logout', { method: 'POST' }),
	me: () => request('/auth/me'),
}

export const invoiceApi = {
	list: () => request('/invoices'),
	create: (payload) => request('/invoices', { method: 'POST', body: payload }),
	update: (id, payload) =>
		request(`/invoices/${id}`, { method: 'PUT', body: payload }),
	remove: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
	get: (id) => request(`/invoices/${id}`),
}

export const dashboardApi = {
	summary: () => request('/invoices?summary=true'),
}
