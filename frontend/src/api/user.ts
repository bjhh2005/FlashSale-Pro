import { postJson, type ApiResponse } from './client'

export interface UserPayload {
  username: string
  password: string
}

export async function registerUser(payload: UserPayload): Promise<ApiResponse> {
  return postJson('/api/user/register', payload)
}

export async function loginUser(payload: UserPayload): Promise<ApiResponse> {
  return postJson('/api/user/login', payload)
}

