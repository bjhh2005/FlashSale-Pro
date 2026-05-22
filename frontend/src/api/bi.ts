import { type ApiResponse } from './client'

const BI_BASE_URL = import.meta.env.VITE_BI_BASE_URL ?? 'http://localhost:8000'

async function biGet<T = unknown>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${BI_BASE_URL}${path}`)
  const data = await res.json()
  return { status: res.status, ok: res.ok, data }
}

async function biPost<T = unknown, B = unknown>(path: string, body?: B): Promise<ApiResponse<T>> {
  const res = await fetch(`${BI_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { status: res.status, ok: res.ok, data }
}

export interface IntentResult {
  user_id: number
  purchase_intent_score: number
  tier: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ShapGlobalResult {
  global_importance: { feature: string; importance: number }[]
  base_value: number
}

export interface ShapLocalResult {
  local_contributions: { feature: string; shap_value: number }[]
  base_value: number
  prediction: number
}

export interface TrainResult {
  auc: number
  report: Record<string, unknown>
  feature_names: string[]
}

export async function predictIntent(userId: number, eventId?: number): Promise<ApiResponse<IntentResult>> {
  return biPost<IntentResult>('/predict', { user_id: userId, event_id: eventId })
}

export async function predictBatch(eventId?: number): Promise<ApiResponse<{ count: number; results: IntentResult[] }>> {
  return biPost<{ count: number; results: IntentResult[] }>('/predict/batch', { event_id: eventId })
}

export async function trainModel(algorithm: 'lightgbm' | 'xgboost' = 'lightgbm'): Promise<ApiResponse<TrainResult>> {
  return biPost<TrainResult>('/train', { algorithm })
}

export async function getShapGlobal(): Promise<ApiResponse<ShapGlobalResult>> {
  return biPost<ShapGlobalResult>('/shap/global')
}

export async function getShapLocal(userId: number): Promise<ApiResponse<ShapLocalResult>> {
  return biPost<ShapLocalResult>(`/shap/local/${userId}`)
}

export async function getIntentScore(userId: number): Promise<ApiResponse<IntentResult>> {
  return biGet<IntentResult>(`/intent/${userId}`)
}
