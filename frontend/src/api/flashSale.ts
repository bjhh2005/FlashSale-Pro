import { getJson, type ApiResponse } from './client'

export interface FlashSaleEvent {
  id: number | string
  name?: string
  title?: string
  startTime?: string
  endTime?: string
  stock?: number
  [key: string]: unknown
}

export interface FlashSaleItem {
  id: number | string
  eventId?: number | string
  productId?: number | string
  flashPrice?: number
  totalStock?: number
  availableStock?: number
  soldCount?: number
  perUserLimit?: number
  [key: string]: unknown
}

export async function fetchFlashSaleEvents(): Promise<ApiResponse<FlashSaleEvent[]>> {
  return getJson<FlashSaleEvent[]>('/api/flash-sale/events')
}

export async function fetchFlashSaleItems(
  eventId: number | string,
): Promise<ApiResponse<FlashSaleItem[]>> {
  return getJson<FlashSaleItem[]>(`/api/flash-sale/events/${eventId}/items`)
}

export async function fetchFlashSaleItemDetail(
  itemId: number | string,
): Promise<ApiResponse<FlashSaleItem>> {
  return getJson<FlashSaleItem>(`/api/flash-sale/items/${itemId}`)
}

