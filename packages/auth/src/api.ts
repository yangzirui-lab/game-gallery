const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://degenerates.site'

const AUTH_LOGIN_API = `${API_BASE_URL}/api/auth/login/password`
const AUTH_REGISTER_API = `${API_BASE_URL}/api/auth/register`
const AUTH_INVITE_CODES_API = `${API_BASE_URL}/api/auth/invite-codes`
const AUTH_LOGOUT_API = `${API_BASE_URL}/api/auth/logout`

export { API_BASE_URL, AUTH_LOGIN_API, AUTH_REGISTER_API, AUTH_INVITE_CODES_API, AUTH_LOGOUT_API }
