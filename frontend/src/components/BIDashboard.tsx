import { useState, useEffect, useCallback } from 'react'
import {
  predictBatch,
  trainModel,
  getShapGlobal,
  getShapLocal,
  type ShapGlobalResult,
  type ShapLocalResult,
  type TrainResult,
} from '../api/bi'
import { getJson } from '../api/client'
import { readDemoEvents, subscribeDemoEvents, summarizeDemoEvents, type DemoEvent } from '../demoBus'

interface FunnelData {
  totalRequests: number
  highIntent: number
  mediumIntent: number
  lowBlocked: number
  degraded: number
}

const demoShapGlobal: ShapGlobalResult = {
  base_value: 0.42,
  global_importance: [
    { feature: 'add_to_cart_count', importance: 0.1862 },
    { feature: 'purchase_count', importance: 0.1621 },
    { feature: 'favorite_count', importance: 0.1187 },
    { feature: 'action_decay_score', importance: 0.0944 },
    { feature: 'recent_1d_action_count', importance: 0.0819 },
    { feature: 'avg_dwell_seconds', importance: 0.0683 },
    { feature: 'cross_product_count', importance: 0.0528 },
    { feature: 'price_sensitivity', importance: 0.0375 },
  ],
}

const demoShapLocal: ShapLocalResult = {
  base_value: 0.42,
  prediction: 0.83,
  local_contributions: [
    { feature: 'add_to_cart_count', shap_value: 0.18 },
    { feature: 'favorite_count', shap_value: 0.12 },
    { feature: 'recent_1d_action_count', shap_value: 0.09 },
    { feature: 'avg_dwell_seconds', shap_value: 0.05 },
    { feature: 'price_sensitivity', shap_value: -0.03 },
  ],
}

const demoTrainResult: TrainResult = {
  auc: 0.8927,
  report: { mode: 'demo-fallback' },
  feature_names: [
    'click_count',
    'favorite_count',
    'add_to_cart_count',
    'purchase_count',
    'avg_dwell_seconds',
    'recent_1d_action_count',
    'action_decay_score',
    'cross_product_count',
    'price_sensitivity',
  ],
}

function FunnelChart({ data }: { data: FunnelData }) {
  if (!data || data.totalRequests === 0) {
    return <div className="text-slate-400 text-sm">暂无数据</div>
  }
  const stages = [
    { label: '网关总请求', value: data.totalRequests, color: 'bg-blue-500' },
    { label: '意愿过滤后', value: data.highIntent + data.mediumIntent, color: 'bg-emerald-500' },
    { label: '高潜用户', value: data.highIntent, color: 'bg-amber-500' },
    { label: '低分拦截', value: data.lowBlocked, color: 'bg-red-500' },
  ]
  const maxVal = Math.max(...stages.map((s) => s.value))
  return (
    <div className="space-y-3">
      {stages.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 text-xs text-slate-300 text-right">{s.label}</div>
          <div className="flex-1 bg-slate-700/50 rounded h-8 overflow-hidden">
            <div
              className={`h-full ${s.color} flex items-center px-2 transition-all duration-500`}
              style={{ width: `${(s.value / maxVal) * 100}%` }}
            >
              <span className="text-white text-xs font-mono">{s.value}</span>
            </div>
          </div>
          <div className="w-16 text-xs text-slate-400">
            {((s.value / data.totalRequests) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  )
}

function ShapBarChart({ data }: { data: ShapGlobalResult }) {
  if (!data?.global_importance?.length) {
    return <div className="text-slate-400 text-sm">暂无SHAP数据</div>
  }
  const top10 = data.global_importance.slice(0, 10)
  const maxVal = Math.max(...top10.map((f) => f.importance))
  return (
    <div className="space-y-2">
      {top10.map((f, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-36 text-xs text-slate-300 text-right truncate" title={f.feature}>
            {f.feature}
          </div>
          <div className="flex-1 bg-slate-700/50 rounded h-6 overflow-hidden">
            <div
              className="h-full bg-purple-500 flex items-center px-2 transition-all duration-500"
              style={{ width: `${(f.importance / maxVal) * 100}%` }}
            >
              <span className="text-white text-xs font-mono">{f.importance.toFixed(4)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LocalShapPanel({ data }: { data: ShapLocalResult }) {
  if (!data?.local_contributions?.length) {
    return <div className="text-slate-400 text-sm">暂无数据</div>
  }
  const top5 = data.local_contributions.slice(0, 5)
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400 mb-2">
        预测概率: {data.prediction.toFixed(4)} | 基准值: {data.base_value.toFixed(4)}
      </div>
      {top5.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-32 text-slate-300 truncate" title={c.feature}>
            {c.feature}
          </span>
          <span className={c.shap_value >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {c.shap_value >= 0 ? '+' : ''}{c.shap_value.toFixed(4)}
          </span>
          <div className="flex-1 h-2 bg-slate-700/50 rounded overflow-hidden">
            <div
              className={`h-full ${c.shap_value >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.abs(c.shap_value) * 20, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BIDashboard() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [shapGlobal, setShapGlobal] = useState<ShapGlobalResult | null>(null)
  const [shapLocal, setShapLocal] = useState<ShapLocalResult | null>(null)
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null)
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>(() => readDemoEvents())
  const [biStatus, setBiStatus] = useState<'online' | 'fallback'>('fallback')
  const [localUserId, setLocalUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'funnel' | 'shap' | 'train'>('funnel')

  const refreshFunnel = useCallback(async () => {
    try {
      const res = await getJson<FunnelData>('/actuator/intent/stats')
      if (res.ok && res.data) {
        setFunnelData(res.data as FunnelData)
        return
      }
    } catch {}
    const summary = summarizeDemoEvents(readDemoEvents())
    setFunnelData({
      totalRequests: Math.max(1, summary.totalEvents),
      highIntent: summary.payCount + summary.seckillCount,
      mediumIntent: summary.cartCount + summary.favoriteCount,
      lowBlocked: summary.blockedCount,
      degraded: Math.max(0, summary.yellow + summary.black),
    })
  }, [])

  useEffect(() => {
    refreshFunnel()
    const timer = setInterval(refreshFunnel, 5000)
    return () => clearInterval(timer)
  }, [refreshFunnel])

  useEffect(() => subscribeDemoEvents(setDemoEvents), [])

  useEffect(() => {
    const summary = summarizeDemoEvents(demoEvents)
    setFunnelData({
      totalRequests: Math.max(1, summary.totalEvents),
      highIntent: summary.payCount + summary.seckillCount,
      mediumIntent: summary.cartCount + summary.favoriteCount,
      lowBlocked: summary.blockedCount,
      degraded: Math.max(0, summary.yellow + summary.black),
    })
  }, [demoEvents])

  const handleTrain = async (algo: 'lightgbm' | 'xgboost') => {
    setLoading(true)
    try {
      const res = await trainModel(algo)
      if (res.ok && res.data) {
        setTrainResult(res.data as TrainResult)
        setBiStatus('online')
      } else {
        setTrainResult(demoTrainResult)
        setBiStatus('fallback')
      }
    } catch {
      setTrainResult(demoTrainResult)
      setBiStatus('fallback')
    }
    setLoading(false)
  }

  const handleBatchPredict = async () => {
    setLoading(true)
    try {
      await predictBatch()
      await refreshFunnel()
      setBiStatus('online')
    } catch {
      await refreshFunnel()
      setBiStatus('fallback')
    }
    setLoading(false)
  }

  const handleShapGlobal = async () => {
    setLoading(true)
    try {
      const res = await getShapGlobal()
      if (res.ok && res.data) {
        setShapGlobal(res.data as ShapGlobalResult)
        setBiStatus('online')
      } else {
        setShapGlobal(demoShapGlobal)
        setBiStatus('fallback')
      }
    } catch {
      setShapGlobal(demoShapGlobal)
      setBiStatus('fallback')
    }
    setLoading(false)
  }

  const handleShapLocal = async () => {
    if (!localUserId) return
    setLoading(true)
    try {
      const res = await getShapLocal(parseInt(localUserId))
      if (res.ok && res.data) {
        setShapLocal(res.data as ShapLocalResult)
        setBiStatus('online')
      } else {
        setShapLocal(demoShapLocal)
        setBiStatus('fallback')
      }
    } catch {
      setShapLocal(demoShapLocal)
      setBiStatus('fallback')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white">BI 决策看板</h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          biStatus === 'online' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'
        }`}>
          {biStatus === 'online' ? 'BI 服务在线' : 'BI 演示兜底'}
        </span>
        <div className="flex gap-2">
          {(['funnel', 'shap', 'train'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded text-xs ${
                tab === t ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {t === 'funnel' ? '转化漏斗' : t === 'shap' ? 'SHAP归因' : '模型训练'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'funnel' && (
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">实时转化漏斗</h3>
          <FunnelChart data={funnelData ?? { totalRequests: 0, highIntent: 0, mediumIntent: 0, lowBlocked: 0, degraded: 0 }} />
          <p className="mt-3 text-xs leading-5 text-slate-400">
            漏斗数据优先来自 Gateway /actuator/intent/stats；BI 服务不可用时，会用商城实时事件生成兜底漏斗。
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleBatchPredict}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white rounded text-xs"
            >
              批量预测并同步
            </button>
          </div>
        </div>
      )}

      {tab === 'shap' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">全局特征重要性 (SHAP)</h3>
            <button
              onClick={handleShapGlobal}
              disabled={loading}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded text-xs mb-3"
            >
              计算全局SHAP
            </button>
            {shapGlobal && <ShapBarChart data={shapGlobal} />}
            {!shapGlobal && <p className="text-xs leading-5 text-slate-400">点击后会优先调用 BI 服务；如果模型未加载，则展示兜底 SHAP，说明哪些行为特征影响购买意愿。</p>}
          </div>
          <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">单用户归因分析</h3>
            <div className="flex gap-2 mb-3">
              <input
                value={localUserId}
                onChange={(e) => setLocalUserId(e.target.value)}
                placeholder="用户ID"
                className="px-3 py-1 bg-slate-700 text-white rounded text-xs w-24"
              />
              <button
                onClick={handleShapLocal}
                disabled={loading || !localUserId}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded text-xs"
              >
                查看归因
              </button>
            </div>
            {shapLocal ? <LocalShapPanel data={shapLocal} /> : <p className="text-xs leading-5 text-slate-400">输入用户 ID，例如 10001。服务不可用时会展示当前路演用户的示例归因。</p>}
          </div>
        </div>
      )}

      {tab === 'train' && (
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">模型训练</h3>
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleTrain('lightgbm')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded text-xs"
            >
              训练 LightGBM
            </button>
            <button
              onClick={() => handleTrain('xgboost')}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white rounded text-xs"
            >
              训练 XGBoost
            </button>
          </div>
          {trainResult && (
            <div className="space-y-2">
              <div className="text-xs text-emerald-400">
                AUC: {trainResult.auc.toFixed(4)}
                {trainResult.auc >= 0.85 ? ' (满足 NFR3 ≥ 0.85)' : ' (未达 NFR3 ≥ 0.85)'}
              </div>
              <div className="text-xs text-slate-300">
                特征数量: {trainResult.feature_names.length}
              </div>
              <div className="text-xs text-slate-400 mt-2">特征列表:</div>
              <div className="flex flex-wrap gap-1">
                {trainResult.feature_names.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!trainResult && (
            <p className="text-xs leading-5 text-slate-400">
              如果 Python BI 服务没有启动，点击训练按钮会展示离线兜底结果，方便路演说明模型指标、特征数量和 AUC 门槛。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
