import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const TOKEN_COOKIE = 'open_facture_token'
const TOKEN_TTL = 1000 * 60 * 60 * 24 * 7 // 7 days

const isProd = process.env.NODE_ENV === 'production'
const sameSitePolicy = isProd ? 'none' : 'lax'
const secureCookie = isProd

export const createToken = (payload) =>
	jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET)

export const setAuthCookie = (res, token) => {
	res.cookie(TOKEN_COOKIE, token, {
		httpOnly: true,
		secure: secureCookie,
		sameSite: sameSitePolicy,
		maxAge: TOKEN_TTL,
	})
}

export const clearAuthCookie = (res) => {
	res.clearCookie(TOKEN_COOKIE, {
		httpOnly: true,
		secure: secureCookie,
		sameSite: sameSitePolicy,
	})
}

export const getTokenFromRequest = (req) =>
	req.cookies?.[TOKEN_COOKIE] ||
	req.headers.authorization?.replace('Bearer ', '')
