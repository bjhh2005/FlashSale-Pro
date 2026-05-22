export interface ApiResponse<T = unknown> {
  status: number
  ok: boolean
  data: T | { raw: string } | null
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_KEY = 'flashsale_token'

async function parseBody(res: Response): Promise<unknown | { raw: string } | null> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers ?? {})
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })

  const data = (await parseBody(res)) as T | { raw: string } | null

  if (res.status === 401) {
    clearToken()
  }

  return {
    status: res.status,
    ok: res.ok,
    data,
  }
}

export async function getJson<T = unknown>(path: string, init?: RequestInit) {
  return request<T>(path, {
    method: 'GET',
    ...init,
  })
}

export async function postJson<T = unknown, B = unknown>(
  path: string,
  body: B,
  init?: RequestInit,
) {
  return request<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
    ...init,
  })
}

export { request }

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

