import './App.css'
import { useState } from 'react'
import type { ApiResponse } from './api/client'
import { clearToken, saveToken } from './api/client'
import { loginUser, registerUser, type LoginData } from './api/user'
import {
  fetchFlashSaleEvents,
  fetchFlashSaleItems,
  type FlashSaleEvent,
  type FlashSaleItem,
} from './api/flashSale'
import {
  listProducts,
  createProduct,
  listAdminEvents,
  createAdminEvent,
  listAdminItemsByEvent,
  createAdminItem,
  type Product,
  type AdminFlashSaleEvent,
  type AdminFlashSaleItem,
} from './api/admin'
import {
  createOrder,
  fetchUserOrders,
  payOrder,
  type FlashSaleOrder,
} from './api/order'

type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null

type IconProps = {
  className?: string
}

function IconUser({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        className="fill-slate-300"
      />
      <path
        className="fill-slate-400/80"
        d="M5 19.5c0-3.1 3-5.3 7-5.3s7 2.2 7 5.3c0 .3-.2.5-.5.5h-13c-.3 0-.5-.2-.5-.5Z"
      />
    </svg>
  )
}

function IconLightning({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        className="fill-emerald-400"
        d="M11.2 2.3 5 13.3c-.3.6.1 1.2.8 1.2h4.3l-1.3 7.1c-.1.6.6 1 1.1.6l7.8-10.8c.4-.5 0-1.3-.7-1.3h-4.5l1.4-6.5c.1-.7-.7-1.1-1.2-.6Z"
      />
    </svg>
  )
}

function IconList({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="6"
        width="14"
        height="2"
        className="fill-slate-400"
        rx="1"
      />
      <rect
        x="5"
        y="11"
        width="14"
        height="2"
        className="fill-slate-400/80"
        rx="1"
      />
      <rect
        x="5"
        y="16"
        width="10"
        height="2"
        className="fill-slate-500/70"
        rx="1"
      />
    </svg>
  )
}

function IconSettings({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        className="fill-slate-500/80"
        d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm0-6.5c-.4 0-.8.3-.9.7l-.3 1.5c-.7.2-1.4.5-2 .8l-1.4-.8a.9.9 0 0 0-1.2.2L3.4 6a.9.9 0 0 0 .1 1.2l1.2 1a6.9 6.9 0 0 0-.1 1.3c0 .4 0 .8.1 1.3l-1.2 1a.9.9 0 0 0-.1 1.2L5 18.1c.3.4.8.5 1.2.2l1.4-.8c.6.3 1.3.6 2 .8l.3 1.5c.1.4.5.7.9.7h1.9c.4 0 .8-.3.9-.7l.3-1.5c.7-.2 1.4-.5 2-.8l1.4.8c.4.3.9.2 1.2-.2l1.6-2.1a.9.9 0 0 0-.1-1.2l-1.2-1c.1-.5.1-.9.1-1.3 0-.4 0-.8-.1-1.3l1.2-1a.9.9 0 0 0 .1-1.2L19 3.4a.9.9 0 0 0-1.2-.2l-1.4.8c-.6-.3-1.3-.6-2-.8l-.3-1.5A.9.9 0 0 0 13.9 2H12Z"
      />
    </svg>
  )
}

function IconCart({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        className="fill-emerald-400/90"
        d="M4 4a1 1 0 0 0 0 2h1.2l1.4 8.3A2.3 2.3 0 0 0 8.9 16h7.3a2.3 2.3 0 0 0 2.3-2l.9-6.1A1 1 0 0 0 18.4 7H7.2l-.2-1.4A2 2 0 0 0 5.2 4H4Z"
      />
      <circle
        cx="9"
        cy="19"
        r="1.3"
        className="fill-slate-300"
      />
      <circle
        cx="16"
        cy="19"
        r="1.3"
        className="fill-slate-300"
      />
    </svg>
  )
}

function IconCreditCard({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        className="fill-slate-700"
      />
      <rect
        x="3"
        y="8"
        width="18"
        height="3"
        className="fill-slate-600"
      />
      <rect
        x="6"
        y="14"
        width="4"
        height="2"
        rx="0.7"
        className="fill-emerald-400"
      />
      <rect
        x="12"
        y="14"
        width="6"
        height="2"
        rx="0.7"
        className="fill-slate-500"
      />
    </svg>
  )
}

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
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user')

  const [username, setUsername] = useState('shangsan')
  const [password, setPassword] = useState('my_password_123')
  const [authLoading, setAuthLoading] = useState<'register' | 'login' | null>(null)
  const [authResult, setAuthResult] = useState<ApiResponse | null>(null)
  const [loginTip, setLoginTip] = useState('')

  const [events, setEvents] = useState<FlashSaleEvent[] | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsRawResult, setEventsRawResult] = useState<ApiResponse | null>(null)

  const [selectedEventId, setSelectedEventId] = useState<number | string | null>(null)
  const [items, setItems] = useState<FlashSaleItem[] | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsRawResult, setItemsRawResult] = useState<ApiResponse | null>(null)

  const [orderUserId, setOrderUserId] = useState('1')
  const [orderItemId, setOrderItemId] = useState('')
  const [orderQuantity, setOrderQuantity] = useState('1')
  const [createOrderLoading, setCreateOrderLoading] = useState(false)
  const [createOrderResult, setCreateOrderResult] = useState<ApiResponse | null>(null)

  const [userOrders, setUserOrders] = useState<FlashSaleOrder[] | null>(null)
  const [userOrdersLoading, setUserOrdersLoading] = useState(false)
  const [userOrdersRawResult, setUserOrdersRawResult] = useState<ApiResponse | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<number | string | null>(null)
  const [payOrderResult, setPayOrderResult] = useState<ApiResponse | null>(null)

  const [products, setProducts] = useState<Product[] | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)
  const [productFormName, setProductFormName] = useState('')
  const [productFormPrice, setProductFormPrice] = useState('99.00')
  const [productFormStatus, setProductFormStatus] = useState('ONLINE')
  const [productFormDescription, setProductFormDescription] = useState('')
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productResult, setProductResult] = useState<ApiResponse | null>(null)

  const [adminEvents, setAdminEvents] = useState<AdminFlashSaleEvent[] | null>(null)
  const [adminEventsLoading, setAdminEventsLoading] = useState(false)
  const [adminEventName, setAdminEventName] = useState('')
  const [adminEventStart, setAdminEventStart] = useState('')
  const [adminEventEnd, setAdminEventEnd] = useState('')
  const [adminEventSubmitting, setAdminEventSubmitting] = useState(false)
  const [adminEventResult, setAdminEventResult] = useState<ApiResponse | null>(null)

  const [adminSelectedEventId, setAdminSelectedEventId] = useState('')
  const [adminItems, setAdminItems] = useState<AdminFlashSaleItem[] | null>(null)
  const [adminItemsLoading, setAdminItemsLoading] = useState(false)
  const [adminItemProductId, setAdminItemProductId] = useState('')
  const [adminItemFlashPrice, setAdminItemFlashPrice] = useState('49.00')
  const [adminItemTotalStock, setAdminItemTotalStock] = useState('100')
  const [adminItemPerUserLimit, setAdminItemPerUserLimit] = useState('1')
  const [adminItemSubmitting, setAdminItemSubmitting] = useState(false)
  const [adminItemResult, setAdminItemResult] = useState<ApiResponse | null>(null)

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
      const loginData = res.data as LoginData | null
      if (res.ok && loginData?.token) {
        saveToken(loginData.token)
        setLoginTip('登录成功，JWT 已保存，后续请求将自动携带 Authorization。')
      } else {
        clearToken()
        setLoginTip('登录失败，未保存 JWT。')
      }
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

  const handleLoadItems = async (eventId: number | string) => {
    setSelectedEventId(eventId)
    setItemsLoading(true)
    try {
      const res = await fetchFlashSaleItems(eventId)
      setItemsRawResult(res)
      if (Array.isArray(res.data)) {
        setItems(res.data)
      } else {
        setItems(null)
      }
    } finally {
      setItemsLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!orderUserId || !orderItemId || !orderQuantity) {
      setCreateOrderResult({
        status: 0,
        ok: false,
        data: '请填写用户 ID、商品 ID 和数量。',
      })
      return
    }
    const payload = {
      userId: Number(orderUserId),
      itemId: Number(orderItemId),
      quantity: Number(orderQuantity),
    }
    setCreateOrderLoading(true)
    try {
      const res = await createOrder(payload)
      setCreateOrderResult(res)
    } finally {
      setCreateOrderLoading(false)
    }
  }

  const handleLoadUserOrders = async () => {
    if (!orderUserId) {
      setUserOrdersRawResult({
        status: 0,
        ok: false,
        data: '请先填写用户 ID。',
      })
      return
    }
    setUserOrdersLoading(true)
    try {
      const res = await fetchUserOrders(orderUserId)
      setUserOrdersRawResult(res)
      if (Array.isArray(res.data)) {
        setUserOrders(res.data)
      } else {
        setUserOrders(null)
      }
    } finally {
      setUserOrdersLoading(false)
    }
  }

  const handlePayOrder = async (orderId: number | string) => {
    setPayingOrderId(orderId)
    try {
      const res = await payOrder(orderId)
      setPayOrderResult(res)
    } finally {
      setPayingOrderId(null)
    }
  }

  const handleLoadProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await listProducts()
      if (Array.isArray(res.data)) {
        setProducts(res.data)
      } else {
        setProducts(null)
      }
      setProductResult(res)
    } finally {
      setProductsLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!productFormName) {
      setProductResult({
        status: 0,
        ok: false,
        data: '请填写商品名称。',
      })
      return
    }
    setProductSubmitting(true)
    try {
      const res = await createProduct({
        name: productFormName,
        originalPrice: Number(productFormPrice) || undefined,
        status: productFormStatus,
        description: productFormDescription || undefined,
      })
      setProductResult(res)
      if (res.ok) {
        await handleLoadProducts()
      }
    } finally {
      setProductSubmitting(false)
    }
  }

  const handleLoadAdminEvents = async () => {
    setAdminEventsLoading(true)
    try {
      const res = await listAdminEvents()
      if (Array.isArray(res.data)) {
        setAdminEvents(res.data)
      } else {
        setAdminEvents(null)
      }
      setAdminEventResult(res)
    } finally {
      setAdminEventsLoading(false)
    }
  }

  const handleCreateAdminEvent = async () => {
    if (!adminEventName || !adminEventStart || !adminEventEnd) {
      setAdminEventResult({
        status: 0,
        ok: false,
        data: '请填写活动名称、开始时间和结束时间。',
      })
      return
    }
    setAdminEventSubmitting(true)
    try {
      const res = await createAdminEvent({
        name: adminEventName,
        startTime: adminEventStart,
        endTime: adminEventEnd,
      })
      setAdminEventResult(res)
      if (res.ok) {
        await handleLoadAdminEvents()
      }
    } finally {
      setAdminEventSubmitting(false)
    }
  }

  const handleLoadAdminItems = async () => {
    if (!adminSelectedEventId) {
      setAdminItemResult({
        status: 0,
        ok: false,
        data: '请先选择一个活动。',
      })
      return
    }
    setAdminItemsLoading(true)
    try {
      const res = await listAdminItemsByEvent(adminSelectedEventId)
      if (Array.isArray(res.data)) {
        setAdminItems(res.data)
      } else {
        setAdminItems(null)
      }
      setAdminItemResult(res)
    } finally {
      setAdminItemsLoading(false)
    }
  }

  const handleCreateAdminItem = async () => {
    if (!adminSelectedEventId || !adminItemProductId) {
      setAdminItemResult({
        status: 0,
        ok: false,
        data: '请选择活动并填写商品 ID。',
      })
      return
    }
    setAdminItemSubmitting(true)
    try {
      const res = await createAdminItem({
        eventId: adminSelectedEventId,
        productId: Number(adminItemProductId),
        flashPrice: Number(adminItemFlashPrice) || undefined,
        totalStock: Number(adminItemTotalStock) || undefined,
        perUserLimit: Number(adminItemPerUserLimit) || undefined,
      })
      setAdminItemResult(res)
      if (res.ok) {
        await handleLoadAdminItems()
      }
    } finally {
      setAdminItemSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700/60">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] text-emerald-300">
                <IconLightning className="h-3 w-3" />
              </span>
              FlashSale-Pro · 秒杀体验台
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              秒杀 · 用户 & 管理后台
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              静态资源由 Nginx / Spring Boot Static 提供，API 统一经
              <code className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-mono text-slate-200">
                /api
              </code>
              反向代理到后端。
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-slate-400 md:items-end">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 ring-1 ring-slate-700/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Gateway：
              <span className="font-mono text-slate-200">http://localhost:9080</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 ring-1 ring-slate-700/60">
              Nginx / Static：
              <span className="font-mono text-slate-200">http://localhost/app</span>
            </div>
          </div>
        </header>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 p-1 text-xs ring-1 ring-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
                activeTab === 'user'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <IconUser className="h-3.5 w-3.5" />
              用户视图
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
                activeTab === 'admin'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <IconSettings className="h-3.5 w-3.5" />
              管理后台
            </button>
          </div>
          <div className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex">
            <IconList className="h-3.5 w-3.5" />
            <span>支持登录 / 活动 / 商品 / 订单全流程点击体验。</span>
          </div>
        </div>

        {activeTab === 'user' ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)]">
            {/* 登录 / 注册 */}
            <section className="relative overflow-hidden rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
              <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
                <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
              </div>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-50">
                      <IconUser className="h-4 w-4" />
                      注册 / 登录
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      使用用户名 + 密码登录后会保存 JWT，后续请求自动携带 Authorization。
                    </p>
                  </div>
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {authLoading === 'register' ? '注册中…' : '注册'}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogin}
                      disabled={authLoading !== null}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/40 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {authLoading === 'login' ? '登录中…' : '登录'}
                    </button>
                  </div>
                </div>
                <details className="mt-3 rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 text-xs open:bg-slate-950/90">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-slate-400">
                    <span>最近一次登录 / 注册返回</span>
                    <span className="text-[10px] text-slate-500">点击展开 / 收起调试信息</span>
                  </summary>
                  <div className="mt-2">
                    <JsonViewer value={prettyResult(authResult)} />
                  </div>
                </details>
                {loginTip ? (
                  <p className="text-[11px] text-emerald-300">{loginTip}</p>
                ) : null}
              </div>
            </section>

            {/* 秒杀活动 + 商品列表 + 下单 */}
            <section className="relative overflow-hidden rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
              <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
                <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
              </div>
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-50">
                      <IconLightning className="h-4 w-4" />
                      秒杀活动 & 商品
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      一键拉取活动列表，点击卡片即可加载该活动下的商品，并支持直接发起秒杀下单。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadEvents}
                    disabled={eventsLoading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <IconList className="h-3.5 w-3.5" />
                    {eventsLoading ? '加载中…' : '加载活动列表'}
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-rows-[minmax(0,1.5fr)_minmax(0,1.2fr)]">
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
                      <p className="text-xs text-slate-400">正在向后端请求活动数据…</p>
                    ) : !events || events.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        还没有活动数据，先点击上方按钮从后端拉取。
                      </p>
                    ) : (
                      <ul className="grid gap-2 text-xs">
                        {events.map((evt) => {
                          const id = (evt as FlashSaleEvent).id
                          const isActive = selectedEventId === id
                          return (
                            <li
                              key={String(id ?? Math.random())}
                              className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 transition ${
                                isActive
                                  ? 'border-emerald-500/70 bg-emerald-950/60'
                                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                              }`}
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
                              <div className="flex flex-col items-end gap-1">
                                {typeof evt.stock === 'number' && (
                                  <div className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300">
                                    剩余
                                    <span className="mx-1 font-semibold text-emerald-400">
                                      {evt.stock}
                                    </span>
                                    件
                                  </div>
                                )}
                                {id != null && (
                                  <button
                                    type="button"
                                    onClick={() => handleLoadItems(id)}
                                    className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                                  >
                                    <IconList className="h-3 w-3" />
                                    查看商品
                                  </button>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)]">
                    <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>活动商品 · 可直接下单</span>
                        {selectedEventId && (
                          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                            活动 ID：{String(selectedEventId)}
                          </span>
                        )}
                      </div>
                      {itemsLoading ? (
                        <p className="text-xs text-slate-400">正在加载该活动下的商品…</p>
                      ) : !items || items.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          请选择上方一个活动后，点击「查看商品」加载数据。
                        </p>
                      ) : (
                        <ul className="grid gap-2 text-[11px]">
                          {items.map((item) => (
                            <li
                              key={String(item.id ?? Math.random())}
                              className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                            >
                              <div className="space-y-0.5">
                                <p className="text-slate-100">
                                  商品 ID：{String(item.productId ?? item.id)}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  秒杀价：
                                  <span className="font-semibold text-emerald-400">
                                    ￥{item.flashPrice ?? '-'}
                                  </span>
                                  ，每人限购 {item.perUserLimit ?? '-'} 件
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  总库存 {item.totalStock ?? '-'}，剩余{' '}
                                  {item.availableStock ?? '-'}，已售 {item.soldCount ?? '-'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setOrderItemId(String(item.id))}
                                className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400"
                              >
                                <IconCart className="h-3.5 w-3.5" />
                                选中抢购
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>发起秒杀下单</span>
                        </div>
                        <div className="grid gap-2 text-[11px]">
                          <label className="space-y-1">
                            <span className="text-slate-300">用户 ID</span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                              value={orderUserId}
                              onChange={(e) => setOrderUserId(e.target.value)}
                              placeholder="例如 1"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-slate-300">
                              商品 ID（自动带入「选中抢购」的商品）
                            </span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                              value={orderItemId}
                              onChange={(e) => setOrderItemId(e.target.value)}
                              placeholder="先在左侧点选一个商品"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-slate-300">购买数量</span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(e.target.value)}
                              placeholder="1"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleCreateOrder}
                            disabled={createOrderLoading}
                            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <IconCart className="h-3.5 w-3.5" />
                            {createOrderLoading ? '下单中…' : '立即下单'}
                          </button>
                        </div>
                      </div>

                      <details className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 text-xs">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-slate-400">
                          <span>活动 / 商品接口原始返回（调试用）</span>
                          <span className="text-[10px] text-slate-500">点击展开 / 收起</span>
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="mb-1 text-[11px] text-slate-500">活动列表返回</p>
                            <JsonViewer value={prettyResult(eventsRawResult)} />
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] text-slate-500">
                              当前活动商品返回
                            </p>
                            <JsonViewer value={prettyResult(itemsRawResult)} />
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] text-slate-500">最近下单返回</p>
                            <JsonViewer value={prettyResult(createOrderResult)} />
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
            {/* 商品管理 */}
            <section className="relative overflow-hidden rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
              <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-screen">
                <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
              </div>
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-50">
                      <IconList className="h-4 w-4" />
                      商品管理
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      通过管理端接口创建基础商品，并查看商品列表。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadProducts}
                    disabled={productsLoading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <IconList className="h-3.5 w-3.5" />
                    {productsLoading ? '加载中…' : '刷新商品列表'}
                  </button>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                    <p className="mb-2 text-[11px] text-slate-400">创建商品</p>
                    <div className="grid gap-2 text-[11px] md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-slate-300">名称</span>
                        <input
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-sky-500 focus:ring-sky-500/40"
                          value={productFormName}
                          onChange={(e) => setProductFormName(e.target.value)}
                          placeholder="例如：iPhone 16 Pro"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-300">原价</span>
                        <input
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-sky-500 focus:ring-sky-500/40"
                          value={productFormPrice}
                          onChange={(e) => setProductFormPrice(e.target.value)}
                          placeholder="99.00"
                        />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-slate-300">描述（可选）</span>
                        <input
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-sky-500 focus:ring-sky-500/40"
                          value={productFormDescription}
                          onChange={(e) => setProductFormDescription(e.target.value)}
                          placeholder="为商品补充一点说明信息"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-300">状态</span>
                        <select
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-sky-500 focus:ring-sky-500/40"
                          value={productFormStatus}
                          onChange={(e) => setProductFormStatus(e.target.value)}
                        >
                          <option value="ONLINE">ONLINE</option>
                          <option value="OFFLINE">OFFLINE</option>
                        </select>
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleCreateProduct}
                          disabled={productSubmitting}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <IconCart className="h-3.5 w-3.5" />
                          {productSubmitting ? '创建中…' : '创建商品'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>商品列表</span>
                      {products && products.length > 0 && (
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                          共 {products.length} 条
                        </span>
                      )}
                    </div>
                    {!products || products.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        还没有商品，先在上方创建一个或点击「刷新商品列表」。
                      </p>
                    ) : (
                      <ul className="grid gap-2 text-[11px]">
                        {products.map((p: Product) => (
                          <li
                            key={String(p.id ?? Math.random())}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                          >
                            <div>
                              <p className="text-slate-100">{p.name ?? '未命名商品'}</p>
                              <p className="text-[11px] text-slate-400">
                                ID：{String(p.id ?? '-')} · 原价：￥{p.originalPrice ?? '-'}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] ${
                                p.status === 'ONLINE'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-slate-700/40 text-slate-300'
                              }`}
                            >
                              {p.status ?? 'UNKNOWN'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <details className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 text-xs">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-slate-400">
                      <span>商品相关接口原始返回</span>
                      <span className="text-[10px] text-slate-500">点击展开 / 收起</span>
                    </summary>
                    <div className="mt-2">
                      <JsonViewer value={prettyResult(productResult)} />
                    </div>
                  </details>
                </div>
              </div>
            </section>

            {/* 活动 & 活动商品管理 */}
            <section className="relative overflow-hidden rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
              <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-screen">
                <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-500/15 blur-3xl" />
              </div>
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-50">
                      <IconLightning className="h-4 w-4" />
                      秒杀活动 & 商品管理
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      管理侧可以创建秒杀活动、为活动绑定商品，并查看活动下的所有条目。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadAdminEvents}
                    disabled={adminEventsLoading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <IconList className="h-3.5 w-3.5" />
                    {adminEventsLoading ? '加载中…' : '刷新活动列表'}
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-rows-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
                  <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                    <p className="mb-2 text-[11px] text-slate-400">创建秒杀活动</p>
                    <div className="grid gap-2 text-[11px] md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-slate-300">名称</span>
                        <input
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                          value={adminEventName}
                          onChange={(e) => setAdminEventName(e.target.value)}
                          placeholder="例如：双十一秒杀专场"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-300">开始时间</span>
                        <input
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                          value={adminEventStart}
                          onChange={(e) => setAdminEventStart(e.target.value)}
                          placeholder="2025-11-11T00:00:00"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-300">结束时间</span>
                        <input
                          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                          value={adminEventEnd}
                          onChange={(e) => setAdminEventEnd(e.target.value)}
                          placeholder="2025-11-11T01:00:00"
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleCreateAdminEvent}
                          disabled={adminEventSubmitting}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <IconLightning className="h-3.5 w-3.5" />
                          {adminEventSubmitting ? '创建中…' : '创建活动'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)]">
                    <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>活动列表（可选择用于配置商品）</span>
                        {adminEvents && adminEvents.length > 0 && (
                          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                            共 {adminEvents.length} 条
                          </span>
                        )}
                      </div>
                      {!adminEvents || adminEvents.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          还没有活动，先在上方创建一个或点击「刷新活动列表」。
                        </p>
                      ) : (
                        <ul className="grid gap-2 text-[11px]">
                          {adminEvents.map((evt: AdminFlashSaleEvent) => {
                            const id = evt.id
                            const isActive = String(adminSelectedEventId) === String(id ?? '')
                            return (
                              <li
                                key={String(id ?? Math.random())}
                                className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-[11px] transition ${
                                  isActive
                                    ? 'border-emerald-500/70 bg-emerald-950/60'
                                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <p className="text-slate-100">
                                    {evt.name || '未命名活动'}{' '}
                                    <span className="text-[10px] text-slate-500">
                                      (ID: {String(id ?? '-')})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {evt.startTime} ~ {evt.endTime}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminSelectedEventId(String(id ?? ''))
                                  }}
                                  className="inline-flex items-center justify-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm"
                                >
                                  选为当前活动
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>为当前活动添加商品</span>
                        {adminSelectedEventId && (
                          <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                            活动 ID：{adminSelectedEventId}
                          </span>
                        )}
                      </div>
                      {!adminSelectedEventId ? (
                        <p className="text-xs text-slate-500">
                          先从左侧活动列表中选择一个活动。
                        </p>
                      ) : (
                        <div className="grid gap-2 text-[11px]">
                          <label className="space-y-1">
                            <span className="text-slate-300">商品 ID</span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-amber-500 focus:ring-amber-500/40"
                              value={adminItemProductId}
                              onChange={(e) => setAdminItemProductId(e.target.value)}
                              placeholder="对应上方商品列表中的 ID"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-slate-300">秒杀价</span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-amber-500 focus:ring-amber-500/40"
                              value={adminItemFlashPrice}
                              onChange={(e) => setAdminItemFlashPrice(e.target.value)}
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-slate-300">总库存</span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-amber-500 focus:ring-amber-500/40"
                              value={adminItemTotalStock}
                              onChange={(e) => setAdminItemTotalStock(e.target.value)}
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-slate-300">每人限购</span>
                            <input
                              className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-amber-500 focus:ring-amber-500/40"
                              value={adminItemPerUserLimit}
                              onChange={(e) => setAdminItemPerUserLimit(e.target.value)}
                            />
                          </label>
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={handleCreateAdminItem}
                              disabled={adminItemSubmitting}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-amber-500/40 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <IconCart className="h-3.5 w-3.5" />
                              {adminItemSubmitting ? '添加中…' : '添加商品到活动'}
                            </button>
                            <button
                              type="button"
                              onClick={handleLoadAdminItems}
                              disabled={adminItemsLoading}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <IconList className="h-3.5 w-3.5" />
                              {adminItemsLoading ? '加载中…' : '查看活动商品'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>当前活动下的所有商品</span>
                    </div>
                    {!adminItems || adminItems.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        暂无数据，选择活动并点击「查看活动商品」后展示。
                      </p>
                    ) : (
                      <ul className="grid gap-2 text-[11px]">
                        {adminItems.map((item: AdminFlashSaleItem) => (
                          <li
                            key={String(item.id ?? Math.random())}
                            className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                          >
                            <div className="space-y-0.5">
                              <p className="text-slate-100">
                                商品 ID：{String(item.productId ?? '-')}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                秒杀价：￥{item.flashPrice ?? '-'} · 总库存：
                                {item.totalStock ?? '-'} · 每人限购：
                                {item.perUserLimit ?? '-'}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] text-slate-400">
                              条目 ID：{String(item.id ?? '-')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <details className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 text-xs">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-slate-400">
                      <span>活动 / 活动商品接口原始返回</span>
                      <span className="text-[10px] text-slate-500">点击展开 / 收起</span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="mb-1 text-[11px] text-slate-500">活动接口返回</p>
                        <JsonViewer value={prettyResult(adminEventResult)} />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] text-slate-500">活动商品接口返回</p>
                        <JsonViewer value={prettyResult(adminItemResult)} />
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 用户订单区块：同时对用户 & 管理后台都可见 */}
        <section className="mt-6 rounded-2xl bg-slate-950/80 p-5 ring-1 ring-slate-800/80 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-slate-50">
                <IconCreditCard className="h-4 w-4" />
                订单列表 & 支付
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                通过用户 ID 查看该用户的所有秒杀订单，并对未支付订单执行「支付」动作。
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>查询条件</span>
              </div>
              <div className="grid gap-2 text-[11px] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <label className="space-y-1">
                  <span className="text-slate-300">用户 ID</span>
                  <input
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/40"
                    value={orderUserId}
                    onChange={(e) => setOrderUserId(e.target.value)}
                    placeholder="与上方下单使用的用户 ID 保持一致"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleLoadUserOrders}
                    disabled={userOrdersLoading}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <IconList className="h-3.5 w-3.5" />
                    {userOrdersLoading ? '加载中…' : '加载用户订单'}
                  </button>
                </div>
              </div>
              <details className="mt-3 rounded-xl border border-slate-800/90 bg-slate-950/90 p-3 text-xs">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-slate-400">
                  <span>订单相关接口原始返回</span>
                  <span className="text-[10px] text-slate-500">点击展开 / 收起</span>
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="mb-1 text-[11px] text-slate-500">订单列表返回</p>
                    <JsonViewer value={prettyResult(userOrdersRawResult)} />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] text-slate-500">最近一次支付返回</p>
                    <JsonViewer value={prettyResult(payOrderResult)} />
                  </div>
                </div>
              </details>
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>订单列表</span>
              </div>
              {!userOrders || userOrders.length === 0 ? (
                <p className="text-xs text-slate-500">
                  暂无订单数据，先在上方完成一次秒杀下单或点击「加载用户订单」。
                </p>
              ) : (
                <ul className="grid gap-2 text-[11px]">
                  {userOrders.map((o: FlashSaleOrder) => {
                    const isPaid = o.orderStatus === 'PAID' || o.paidAt
                    return (
                      <li
                        key={String(o.id)}
                        className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                      >
                        <div className="space-y-0.5">
                          <p className="text-slate-100">
                            订单 ID：{String(o.id)} · 商品 ID：{String(o.productId ?? '-')}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            金额：￥{o.totalAmount ?? '-'} · 数量：{o.quantity ?? '-'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            创建时间：{o.createdAt ?? '-'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {o.orderStatus ?? (isPaid ? 'PAID' : 'UNPAID')}
                          </span>
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => handlePayOrder(o.id)}
                              disabled={payingOrderId === o.id}
                              className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <IconCreditCard className="h-3.5 w-3.5" />
                              {payingOrderId === o.id ? '支付中…' : '去支付'}
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

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
