import { postJson } from './client'

interface BehaviorEvent {
  userId: number
  productId?: number
  eventId?: number
  itemId?: number
  action: 'CLICK' | 'FAVORITE' | 'ADD_TO_CART' | 'BROWSE' | 'SHARE' | 'PURCHASE'
  dwellSeconds?: number
  extra?: string
}

const eventQueue: BehaviorEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL = 3000
const MAX_QUEUE_SIZE = 20

export function trackBehavior(event: BehaviorEvent) {
  eventQueue.push(event)
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushBehaviorEvents()
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushBehaviorEvents, FLUSH_INTERVAL)
  }
}

export function trackClick(userId: number, productId: number, eventId?: number, itemId?: number) {
  trackBehavior({ userId, productId, eventId, itemId, action: 'CLICK' })
}

export function trackFavorite(userId: number, productId: number, eventId?: number) {
  trackBehavior({ userId, productId, eventId, action: 'FAVORITE' })
}

export function trackAddToCart(userId: number, productId: number, itemId?: number) {
  trackBehavior({ userId, productId, itemId, action: 'ADD_TO_CART' })
}

export function trackBrowse(userId: number, productId: number, dwellSeconds: number, eventId?: number) {
  trackBehavior({ userId, productId, eventId, action: 'BROWSE', dwellSeconds })
}

export function trackShare(userId: number, productId: number) {
  trackBehavior({ userId, productId, action: 'SHARE' })
}

export function trackPurchase(userId: number, productId: number, itemId: number) {
  trackBehavior({ userId, productId, itemId, action: 'PURCHASE' })
}

export async function flushBehaviorEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  if (eventQueue.length === 0) return

  const eventsToSend = eventQueue.splice(0, eventQueue.length)
  try {
    await postJson('/api/behavior/events/batch', eventsToSend)
  } catch {
    eventQueue.unshift(...eventsToSend)
  }
}

export function startDwellTimer(userId: number, productId: number, eventId?: number) {
  const start = Date.now()
  return () => {
    const dwellSeconds = Math.round((Date.now() - start) / 1000)
    trackBrowse(userId, productId, dwellSeconds, eventId)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushBehaviorEvents()
  })
}
