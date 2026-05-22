import { getJson, postJson, type ApiResponse } from './client'

export interface FlashSaleOrder {
  id: number | string
  userId?: number | string
  eventId?: number | string
  itemId?: number | string
  productId?: number | string
  quantity?: number
  orderStatus?: string
  totalAmount?: number
  createdAt?: string
  paidAt?: string | null
  [key: string]: unknown
}

export interface CreateOrderPayload {
  userId: number
  itemId: number
  quantity: number
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<ApiResponse<FlashSaleOrder>> {
  return postJson('/api/flash-sale/order', payload, {
    headers: {
      'X-User-Id': String(payload.userId),
    },
  })
}

export async function fetchUserOrders(
  userId: number | string,
): Promise<ApiResponse<FlashSaleOrder[]>> {
  return getJson<FlashSaleOrder[]>(`/api/flash-sale/order/user/${userId}`)
}

export async function payOrder(orderId: number | string): Promise<ApiResponse<FlashSaleOrder>> {
  return postJson(`/api/flash-sale/order/${orderId}/pay`, {})
}

