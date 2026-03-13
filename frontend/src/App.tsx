import './App.css'
import { useState } from 'react'
import type { ApiResponse } from './api/client'
import { loginUser, registerUser } from './api/user'
import { fetchFlashSaleEvents, type FlashSaleEvent } from './api/flashSale'

type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null

function JsonViewer({ value }: { value: JsonLike }) {
  if (value === null || value === undefined || value === '') {
    return (
      <p className="text-slate-500 text-sm">
        暂无数据，先在左侧发起一次请求。
      </p>
    )
  }

  if (typeof value === 'string') {
    return (
      <pre className="text-xs leading-relaxed font-mono text-slate-100 whitespace-pre-wrap">
        {value}
      </pre>
    )
  }

  return (
    <pre className="text-xs leading-relaxed font-mono text-slate-100 whitespace-pre overflow-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function prettyResult(res: ApiResponse | null): JsonLike {
  if (!res) return null
  return {
    status: res.status,
    ok: res.ok,
    data: res.data,
  }
}

function App() {
  const [username, setUsername] = useState('shangsan')
  const [password, setPassword] = useState('my_password_123')
  const [authLoading, setAuthLoading] = useState<'register' | 'login' | null>(null)
  const [authResult, setAuthResult] = useState<ApiResponse | null>(null)

  const [events, setEvents] = useState<FlashSaleEvent[] | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsRawResult, setEventsRawResult] = useState<ApiResponse | null>(null)

  const handleRegister = async () => {
    if (!username || !password) {
      setAuthResult({
        status: 0,
        ok: false,
        data: '请输入用户名和密码。',
      })
      return
    }
    setAuthLoading('register')
    try {
      const res = await registerUser({ username, password })
      setAuthResult(res)
    } finally {
      setAuthLoading(null)
    }
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setAuthResult({
        status: 0,
        ok: false,
        data: '请输入用户名和密码。',
      })
      return
    }
    setAuthLoading('login')
    try {
      const res = await loginUser({ username, password })
      setAuthResult(res)
    } finally {
      setAuthLoading(null)
    }
  }

  const handleLoadEvents = async () => {
    setEventsLoading(true)
    try {
      const res = await fetchFlashSaleEvents()
      setEventsRawResult(res)
      if (Array.isArray(res.data)) {
        setEvents(res.data)
      } else {
        setEvents(null)
      }
    } finally {
      setEventsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700/60">
              FlashSale-Pro · 前后端动静分离 Demo
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              秒杀控制台
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              静态资源由 Nginx / Spring Boot Static 提供，API 统一经
              <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-mono text-slate-200">
                /api
              </code>
              反向代理到后端。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 ring-1 ring-slate-700/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              后端：<span className="font-mono text-slate-200">http://localhost:8080</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 ring-1 ring-slate-700/60">
              Nginx / Static：<span className="font-mono text-slate-200">http://localhost/app</span>
            </span>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
          {/* 登录 / 注册 */}
          <section className="relative overflow-hidden rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
            <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
              <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-50">注册 / 登录</h2>
                <p className="mt-1 text-xs text-slate-400">
                  使用简单的用户名 + 密码完成注册和登录，后续请求会自动复用会话。
                </p>
              </div>
              <div className="grid gap-3">
                <label className="space-y-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    用户名
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-brand focus:ring-brand/50"
                    placeholder="shangsan"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    密码
                  </span>
                  <input
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-brand focus:ring-brand/50"
                    type="password"
                    placeholder="my_password_123"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={authLoading !== null}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading === 'register' ? '注册中…' : '注册'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={authLoading !== null}
                    className="inline-flex items-center justify-center rounded-xl bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/40 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading === 'login' ? '登录中…' : '登录'}
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>最近一次登录 / 注册返回</span>
                </div>
                <JsonViewer value={prettyResult(authResult)} />
              </div>
            </div>
          </section>

          {/* 秒杀活动 + 结果展示 */}
          <section className="relative overflow-hidden rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
            <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
              <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-50">
                    秒杀活动列表
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    点击按钮从
                    <code className="mx-1 rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-mono text-slate-100">
                      /api/flash-sale/events
                    </code>
                    拉取当前可用的秒杀活动。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadEvents}
                  disabled={eventsLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {eventsLoading ? '加载中…' : '加载活动列表'}
                </button>
              </div>

              <div className="grid gap-3 lg:grid-rows-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>活动列表</span>
                    {events && events.length > 0 && (
                      <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                        共 {events.length} 条
                      </span>
                    )}
                  </div>
                  {eventsLoading ? (
                    <p className="text-xs text-slate-400">请求中…</p>
                  ) : !events || events.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      还没有活动数据，先点击上方按钮从后端拉取。
                    </p>
                  ) : (
                    <ul className="grid gap-2 text-xs">
                      {events.map((evt) => (
                        <li
                          key={String((evt as FlashSaleEvent).id ?? Math.random())}
                          className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <p className="text-slate-100">
                              {evt.title || evt.name || '未命名活动'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {evt.startTime && evt.endTime
                                ? `${evt.startTime} ~ ${evt.endTime}`
                                : '时间信息未知'}
                            </p>
                          </div>
                          {typeof evt.stock === 'number' && (
                            <div className="ml-2 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300">
                              剩余
                              <span className="mx-1 font-semibold text-emerald-400">
                                {evt.stock}
                              </span>
                              件
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>原始返回（便于调试）</span>
                  </div>
                  <JsonViewer value={prettyResult(eventsRawResult)} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-[11px] text-slate-500">
          <span>
            前端构建：Vite + React + Tailwind，通过
            <code className="mx-1 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-100">
              /app
            </code>
            挂载在后端 static 中。
          </span>
          <span>现有静态页（index.html/app.js）仍可并存使用。</span>
        </footer>
      </div>
    </div>
  )
}

export default App
