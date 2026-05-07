interface User {
  id: string
  username: string
}

interface LoginRequest {
  account?: string
  username?: string
  password: string
}

interface RegisterRequest {
  account: string
  username: string
  password: string
  inviteCode: string
}

interface LoginResponse {
  token: string
  user: User
}

interface AuthResponse {
  data: LoginResponse
}

interface AuthActionResult {
  user: User | null
  error: string | null
}

interface InviteCodeData {
  code: string
  generated_for_day: string
  generated_at: string
  used_at?: string
  reused_existing: boolean
}

interface InviteCodeResponse {
  data: InviteCodeData
}

interface InviteCodeActionResult {
  inviteCode: InviteCodeData | null
  error: string | null
}

export type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  AuthResponse,
  AuthActionResult,
  InviteCodeData,
  InviteCodeResponse,
  InviteCodeActionResult,
}
