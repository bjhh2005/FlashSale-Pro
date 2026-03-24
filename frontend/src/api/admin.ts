import { getJson, postJson, type ApiResponse } from './client'

export interface Product {
  id?: number | string
  name?: string
  description?: string
  originalPrice?: number
  status?: string
  [key: string]: unknown
}

export interface AdminFlashSaleEvent {
  id?: number | string
  name?: string
  startTime?: string
  endTime?: string
  status?: string
  [key: string]: unknown
}

export interface AdminFlashSaleItem {
  id?: number | string
  eventId?: number | string
  productId?: number | string
  flashPrice?: number
  totalStock?: number
  availableStock?: number
  perUserLimit?: number
  [key: string]: unknown
}

// 商品管理
export async function listProducts(): Promise<ApiResponse<Product[]>> {
  return getJson<Product[]>('/api/admin/product')
}

export async function createProduct(payload: Product): Promise<ApiResponse<Product>> {
  return postJson('/api/admin/product', payload)
}

// 秒杀活动管理
export async function listAdminEvents(): Promise<ApiResponse<AdminFlashSaleEvent[]>> {
  return getJson<AdminFlashSaleEvent[]>('/api/admin/flash-sale/event')
}

export async function createAdminEvent(
  payload: AdminFlashSaleEvent,
): Promise<ApiResponse<AdminFlashSaleEvent>> {
  return postJson('/api/admin/flash-sale/event', payload)
}

// 活动商品管理
export async function listAdminItemsByEvent(
  eventId: number | string,
): Promise<ApiResponse<AdminFlashSaleItem[]>> {
  return getJson<AdminFlashSaleItem[]>(`/api/admin/flash-sale/item/by-event/${eventId}`)
}

export async function createAdminItem(
  payload: AdminFlashSaleItem,
): Promise<ApiResponse<AdminFlashSaleItem>> {
  return postJson('/api/admin/flash-sale/item', payload)
}

