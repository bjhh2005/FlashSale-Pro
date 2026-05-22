export type DemoTrafficColor = 'GREEN' | 'YELLOW' | 'BLACK'
export type DemoAction = 'BROWSE' | 'FAVORITE' | 'ADD_TO_CART' | 'SECKILL' | 'PAY'
export type DemoEventResult = 'CAPTURED' | 'CONVERTED' | 'BLOCKED' | 'PAID'

export interface DemoEvent {
  id: number
  time: string
  userId: number
  productId: number
  itemId: number
  eventId: number
  productName: string
  action: DemoAction
  color: DemoTrafficColor
  entropy: number
  matrix: number[][]
  reason: string
  latency: number
  amount: number
  stockBefore: number
  stockAfter: number
  result: DemoEventResult
}

export interface DemoSummary {
  totalEvents: number
  browseCount: number
  favoriteCount: number
  cartCount: number
  seckillCount: number
  payCount: number
  blockedCount: number
  revenue: number
  green: number
  yellow: number
  black: number
  latest?: DemoEvent
}

const STORAGE_KEY = 'flashsale.demo.events.v1'
const EVENT_NAME = 'flashsale-demo-events'
const MAX_EVENTS = 60

function isDemoEvent(value: unknown): value is DemoEvent {
  return Boolean(value && typeof value === 'object' && 'id' in value && 'action' in value)
}

export function readDemoEvents(): DemoEvent[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter(isDemoEvent) : []
  } catch {
    return []
  }
}

export function pushDemoEvent(event: DemoEvent) {
  if (typeof window === 'undefined') return

  const next = [event, ...readDemoEvents()].slice(0, MAX_EVENTS)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }))
}

export function subscribeDemoEvents(callback: (events: DemoEvent[]) => void) {
  if (typeof window === 'undefined') return () => {}

  const handleCustom = (event: Event) => {
    const detail = (event as CustomEvent<DemoEvent[]>).detail
    callback(Array.isArray(detail) ? detail : readDemoEvents())
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback(readDemoEvents())
  }

  window.addEventListener(EVENT_NAME, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}

export function summarizeDemoEvents(events: DemoEvent[]): DemoSummary {
  return events.reduce<DemoSummary>(
    (summary, event, index) => {
      summary.totalEvents += 1
      if (event.action === 'BROWSE') summary.browseCount += 1
      if (event.action === 'FAVORITE') summary.favoriteCount += 1
      if (event.action === 'ADD_TO_CART') summary.cartCount += 1
      if (event.action === 'SECKILL') summary.seckillCount += 1
      if (event.action === 'PAY') summary.payCount += 1
      if (event.result === 'BLOCKED') summary.blockedCount += 1
      if (event.result === 'CONVERTED' || event.result === 'PAID') summary.revenue += event.amount
      if (event.color === 'GREEN') summary.green += 1
      if (event.color === 'YELLOW') summary.yellow += 1
      if (event.color === 'BLACK') summary.black += 1
      if (index === 0) summary.latest = event
      return summary
    },
    {
      totalEvents: 0,
      browseCount: 0,
      favoriteCount: 0,
      cartCount: 0,
      seckillCount: 0,
      payCount: 0,
      blockedCount: 0,
      revenue: 0,
      green: 0,
      yellow: 0,
      black: 0,
    },
  )
}

export function resetDemoEvents() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: [] }))
}
