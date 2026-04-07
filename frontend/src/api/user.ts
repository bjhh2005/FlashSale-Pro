import { postJson, type ApiResponse } from './client'

export interface UserPayload {
  username: string
  password: string
}

export interface LoginData {
  token: string
  userId: number
  username: string
  expireAt: string
}

export async function registerUser(payload: UserPayload): Promise<ApiResponse> {
  return postJson('/api/user/register', payload)
}

export async function loginUser(payload: UserPayload): Promise<ApiResponse<LoginData>> {
  return postJson<LoginData>('/api/user/login', payload)
}

