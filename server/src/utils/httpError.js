export class HttpError extends Error {
	constructor(status, message, payload) {
		super(message)
		this.name = 'HttpError'
		this.status = status
		if (payload) {
			this.payload = payload
		}
	}
}

export const badRequest = (message, payload) =>
	new HttpError(400, message, payload)
export const unauthorized = (message) => new HttpError(401, message)
export const forbidden = (message) => new HttpError(403, message)
export const notFound = (message) => new HttpError(404, message)
export const conflict = (message, payload) => new HttpError(409, message, payload)
export const unprocessable = (message, payload) =>
	new HttpError(422, message, payload)
