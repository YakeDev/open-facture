const API_BASE_URL =
	(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(
		/\/$/,
		''
	)

const buildUrl = (path, params) => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	const url = new URL(`${API_BASE_URL}${normalizedPath}`)

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null || value === '') return
			url.searchParams.set(key, value)
		})
	}

	return url.toString()
}

const request = async (
	path,
	{ method = 'GET', body, headers, params, signal, ...rest } = {}
) => {
	const response = await fetch(buildUrl(path, params), {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body:
			body != null && method !== 'GET' && method !== 'HEAD'
				? JSON.stringify(body)
				: undefined,
		credentials: 'include',
		signal,
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
		return undefined
	}
}

export const authApi = {
	register: (payload, options) =>
		request('/auth/register', { method: 'POST', body: payload, ...options }),
	login: (payload, options) =>
		request('/auth/login', { method: 'POST', body: payload, ...options }),
	logout: (options) => request('/auth/logout', { method: 'POST', ...options }),
	me: (options) => request('/auth/me', options),
}

export const invoiceApi = {
	list: (options) => request('/invoices', options),
	create: (payload, options) =>
		request('/invoices', { method: 'POST', body: payload, ...options }),
	update: (id, payload, options) =>
		request(`/invoices/${id}`, { method: 'PUT', body: payload, ...options }),
	remove: (id, options) =>
		request(`/invoices/${id}`, { method: 'DELETE', ...options }),
	get: (id, options) => request(`/invoices/${id}`, options),
	summary: (options) => request('/invoices/summary', options),
}

export const dashboardApi = {
	summary: (options) => invoiceApi.summary(options),
}

export const profileApi = {
	uploadLogo: (payload, options) =>
		request('/profile/logo', { method: 'POST', body: payload, ...options }),
}
