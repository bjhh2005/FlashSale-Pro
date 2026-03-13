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

export async function fetchFlashSaleEvents(): Promise<ApiResponse<FlashSaleEvent[]>> {
  return getJson<FlashSaleEvent[]>('/api/flash-sale/events')
}

