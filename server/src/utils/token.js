import jwt from 'jsonwebtoken'
import { cookieOptions, env } from '../config/index.js'

const TOKEN_COOKIE = 'open_facture_token'
const TOKEN_EXPIRATION = '7d'

export const createToken = ({ userId, tokenVersion }) =>
	jwt.sign({ userId, tokenVersion }, env.JWT_SECRET, {
		expiresIn: TOKEN_EXPIRATION,
	})

export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET)

export const setAuthCookie = (res, token) => {
	res.cookie(TOKEN_COOKIE, token, cookieOptions)
}

export const clearAuthCookie = (res) => {
	res.clearCookie(TOKEN_COOKIE, {
		...cookieOptions,
		maxAge: undefined,
	})
}

export const getTokenFromRequest = (req) =>
	req.cookies?.[TOKEN_COOKIE] ||
	req.headers.authorization?.replace('Bearer ', '')
