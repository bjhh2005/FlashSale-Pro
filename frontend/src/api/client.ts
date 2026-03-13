export interface ApiResponse<T = unknown> {
  status: number
  ok: boolean
  data: T | { raw: string } | null
}

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
  const res = await fetch(path, {
    credentials: 'include',
    ...options,
  })

  const data = (await parseBody(res)) as T | { raw: string } | null

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

