import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import ReactECharts from 'echarts-for-react'
import BIDashboard from './BIDashboard'
import { readDemoEvents, subscribeDemoEvents, summarizeDemoEvents, type DemoEvent } from '../demoBus'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

interface EntropyStats {
  totalRequests: number
  green: number
  yellow: number
  black: number
  fallback?: number
}

interface PidDashboard {
  currentRate: number
  blackRate: number
  currentQps: number
  currentLoad: number
  targetLoad: number
  error: number
  qpsHistory: Record<string, number>
  loadHistory: Record<string, number>
}

const demoEntropy: EntropyStats = {
  totalRequests: 28640,
  green: 21890,
  yellow: 5120,
  black: 1630,
  fallback: 138,
}

const demoPid: PidDashboard = {
  currentRate: 720,
  blackRate: 0.057,
  currentQps: 684,
  currentLoad: 72,
  targetLoad: 75,
  error: -3,
  qpsHistory: {
    '10:00': 420,
    '10:01': 560,
    '10:02': 790,
    '10:03': 760,
    '10:04': 705,
    '10:05': 684,
  },
  loadHistory: {
    '10:00': 48,
    '10:01': 63,
    '10:02': 84,
    '10:03': 79,
    '10:04': 74,
    '10:05': 72,
  },
}

export default function AdminDashboard() {
  const [entropyStats, setEntropyStats] = useState<EntropyStats>(demoEntropy)
  const [pidData, setPidData] = useState<PidDashboard>(demoPid)
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>(() => readDemoEvents())
  const [online, setOnline] = useState(false)
  const [lastRefresh, setLastRefresh] = useState('演示数据')

  useEffect(() => {
    let alive = true

    async function refresh() {
      let ok = false
      try {
        const statsRes = await fetch(`${API_BASE}/actuator/entropy/stats`)
        if (statsRes.ok) {
          const stats = (await statsRes.json()) as EntropyStats
          if (alive) setEntropyStats({ ...demoEntropy, ...stats })
          ok = true
        }
      } catch {}

      try {
        const pidRes = await fetch(`${API_BASE}/actuator/pid/dashboard`)
        if (pidRes.ok) {
          const pid = (await pidRes.json()) as PidDashboard
          if (alive) setPidData({ ...demoPid, ...pid })
          ok = true
        }
      } catch {}

      if (alive) {
        setOnline(ok)
        setLastRefresh(new Intl.DateTimeFormat('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()))
      }
    }

    refresh()
    const timer = window.setInterval(refresh, 2500)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => subscribeDemoEvents(setDemoEvents), [])

  const demoSummary = useMemo(() => summarizeDemoEvents(demoEvents), [demoEvents])
  const entropyBuckets = useMemo(() => {
    const black = demoEvents.filter((event) => event.entropy < 0.5 || event.color === 'BLACK').length
    const yellow = demoEvents.filter((event) => event.color === 'YELLOW').length
    const green = demoEvents.filter((event) => event.color === 'GREEN').length
    if (demoEvents.length === 0) {
      return [
        { name: 'H < 0.5 机器脚本', value: 11, color: '#ef4444' },
        { name: '0.5-1.5 可疑流量', value: 27, color: '#f59e0b' },
        { name: '1.5-3.5 正常用户', value: 62, color: '#10b981' },
      ]
    }
    return [
      { name: 'H < 0.5 机器脚本', value: black, color: '#ef4444' },
      { name: '0.5-1.5 可疑流量', value: yellow, color: '#f59e0b' },
      { name: '1.5-3.5 正常用户', value: green, color: '#10b981' },
    ]
  }, [demoEvents])
  const mergedEntropy = useMemo(
    () => ({
      totalRequests: entropyStats.totalRequests + demoSummary.totalEvents,
      green: entropyStats.green + demoSummary.green,
      yellow: entropyStats.yellow + demoSummary.yellow,
      black: entropyStats.black + demoSummary.black,
      fallback: entropyStats.fallback,
    }),
    [demoSummary, entropyStats],
  )
  const mergedTotalColored = mergedEntropy.green + mergedEntropy.yellow + mergedEntropy.black
  const blockRate = mergedTotalColored > 0 ? ((mergedEntropy.black / mergedTotalColored) * 100).toFixed(1) : '0.0'
  const demoConversion = demoSummary.seckillCount > 0 ? Math.round((demoSummary.payCount / demoSummary.seckillCount) * 100) : 0

  const trafficPieOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      textStyle: { color: '#cbd5e1' },
    },
    series: [
      {
        name: 'X-Traffic-Color',
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: { color: '#e2e8f0', formatter: '{b}\n{d}%' },
        data: [
          { value: mergedEntropy.green, name: 'GREEN 高潜', itemStyle: { color: '#10b981' } },
          { value: mergedEntropy.yellow, name: 'YELLOW 降级', itemStyle: { color: '#f59e0b' } },
          { value: mergedEntropy.black, name: 'BLACK 拦截', itemStyle: { color: '#ef4444' } },
        ],
      },
    ],
  }), [mergedEntropy])

  const funnelOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 42, right: 18, top: 34, bottom: 38 },
    xAxis: {
      type: 'category',
      data: ['浏览', '收藏', '加购', '秒杀', '支付'],
      axisLabel: { color: '#cbd5e1' },
      axisLine: { lineStyle: { color: '#475569' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: 34,
        data: [
          { value: demoSummary.browseCount, itemStyle: { color: '#38bdf8', borderRadius: [6, 6, 0, 0] } },
          { value: demoSummary.favoriteCount, itemStyle: { color: '#a78bfa', borderRadius: [6, 6, 0, 0] } },
          { value: demoSummary.cartCount, itemStyle: { color: '#f59e0b', borderRadius: [6, 6, 0, 0] } },
          { value: demoSummary.seckillCount, itemStyle: { color: '#ef4444', borderRadius: [6, 6, 0, 0] } },
          { value: demoSummary.payCount, itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] } },
        ],
      },
    ],
  }), [demoSummary])

  const entropyOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 18, top: 36, bottom: 46 },
    xAxis: {
      type: 'category',
      data: entropyBuckets.map((item) => item.name),
      axisLabel: { color: '#cbd5e1', interval: 0 },
      axisLine: { lineStyle: { color: '#475569' } },
    },
    yAxis: {
      type: 'value',
      name: '占比%',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        type: 'bar',
        barWidth: 34,
        data: entropyBuckets.map((item) => ({
          value: item.value,
          itemStyle: { color: item.color, borderRadius: [6, 6, 0, 0] },
        })),
      },
    ],
  }), [entropyBuckets])

  const pidOption = useMemo(() => {
    const times = Object.keys(pidData.qpsHistory || {}).sort()
    return {
      tooltip: { trigger: 'axis' },
      legend: {
        top: 0,
        textStyle: { color: '#cbd5e1' },
        data: ['QPS', 'DB Load'],
      },
      grid: { left: 52, right: 54, top: 42, bottom: 34 },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#475569' } },
      },
      yAxis: [
        {
          type: 'value',
          name: 'QPS',
          axisLabel: { color: '#10b981' },
          splitLine: { lineStyle: { color: '#1e293b' } },
        },
        {
          type: 'value',
          name: 'Load',
          axisLabel: { color: '#f59e0b' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'QPS',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          data: times.map((time) => pidData.qpsHistory[time] ?? 0),
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: { color: '#10b981' },
          areaStyle: { color: 'rgba(16,185,129,0.12)' },
        },
        {
          name: 'DB Load',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 7,
          data: times.map((time) => pidData.loadHistory[time] ?? 0),
          lineStyle: { width: 3, color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: pidData.targetLoad,
                lineStyle: { color: '#ef4444', type: 'dashed' },
                label: { formatter: '目标负载', color: '#ef4444' },
              },
            ],
          },
        },
      ],
    }
  }, [pidData])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  /admin/dashboard 管理员侧
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                  ECharts 三图表 + BI 决策看板
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${online ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>
                  {online ? 'Gateway 指标在线' : '演示数据模式'}
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  商城联动事件 {demoSummary.totalEvents}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                FlashSale-Pro 分布式秒杀指挥台
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                这页优先展示微服务架构如何承接秒杀流量：Nginx 入口、Gateway 统一治理、goods 双实例横向扩展、order/stock 解耦、Redis 共享状态、RabbitMQ 异步削峰。风控和 BI 是架构上的保护与决策层。
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">最近刷新</p>
              <p className="font-mono text-slate-100">{lastRefresh}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="服务实例" value="7" note="nginx / gateway / goods x2 / order / stock / bi" />
        <Kpi title="商品服务副本" value="2" note="goods:8081 + goods-2:8083 横向扩展" />
        <Kpi title="当前 QPS" value={Math.round(pidData.currentQps + demoSummary.totalEvents * 8).toString()} note={`Gateway 令牌桶 ${Math.round(pidData.currentRate)}/s`} />
        <Kpi title="保护性拦截" value={`${blockRate}%`} note={`仅异常脚本 ${demoSummary.blockedCount} 次`} tone="amber" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-5 pb-5 lg:grid-cols-6">
        {[
          ['Nginx', '静态资源 + 反向代理', '入口分流'],
          ['Gateway', 'JWT / 熵染色 / PID', '统一治理'],
          ['goods x2', '商品查询双实例', '横向扩展'],
          ['order', '创建订单 / 支付', '业务解耦'],
          ['Redis', '库存 / 熵矩阵 / 令牌', '共享状态'],
          ['RabbitMQ', '异步削峰', '抗峰值'],
        ].map(([name, detail, tag]) => (
          <div key={name} className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-sm font-bold text-cyan-200">{name}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
            <p className="mt-3 rounded-full bg-slate-950 px-2 py-1 text-center text-[11px] text-slate-300">{tag}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-5 xl:grid-cols-3">
        <ChartPanel title="商城实时转化漏斗" subtitle="从 /mall 点击行为同步而来，适合现场边点边看">
          <ReactECharts option={funnelOption} theme="dark" style={{ height: 320 }} />
        </ChartPanel>
        <ChartPanel title="香农条件熵保护层" subtitle="只对异常脚本做降级/拦截，不把真实用户连续抢购当作恶意">
          <ReactECharts option={entropyOption} theme="dark" style={{ height: 320 }} />
        </ChartPanel>
        <ChartPanel title="Gateway 分级流量" subtitle="GREEN 正常放行，YELLOW 观察降级，BLACK 保护性拦截">
          <ReactECharts option={trafficPieOption} theme="dark" style={{ height: 320 }} />
        </ChartPanel>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChartPanel title="PID 自适应负载收敛" subtitle="根据负载误差反哺令牌桶速率">
          <ReactECharts option={pidOption} theme="dark" style={{ height: 320 }} />
        </ChartPanel>
        <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">商城事件流</h2>
            <span className="text-xs text-slate-500">GMV ¥{demoSummary.revenue.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <MiniKpi label="支付转化" value={`${demoConversion}%`} />
            <MiniKpi label="秒杀成功" value={`${demoSummary.seckillCount}`} />
            <MiniKpi label="黑流量" value={`${demoSummary.blockedCount}`} tone="red" />
          </div>
          <div className="mt-4 space-y-2">
            {demoEvents.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">
                先在用户侧商城点击浏览、加购或秒杀，这里会实时出现对应事件。
              </div>
            ) : (
              demoEvents.slice(0, 8).map((event) => (
                <div key={event.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200">{actionText(event.action)} · User #{event.userId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${trafficTone(event.color)}`}>{event.color}</span>
                  </div>
                  <p className="mt-1 truncate text-slate-400">{event.productName}</p>
                  <p className="mt-1 text-slate-500">
                    {event.time} · H(Y|X)={event.entropy} · {event.latency}ms · 库存 {event.stockBefore}→{event.stockAfter}
                  </p>
                  <p className="mt-1 text-slate-500">{event.reason}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="text-sm font-semibold text-white">系统链路状态</h2>
          <div className="mt-4 space-y-3">
            <NodeStatus name="Nginx" detail="80 静态资源 / 反向代理" status="RUNNING" />
            <NodeStatus name="Gateway" detail="9080 Entropy + PID + JWT" status={online ? 'RUNNING' : 'DEMO'} />
            <NodeStatus name="goods" detail="8081 商品与活动实例 A" status="READY" />
            <NodeStatus name="goods-2" detail="8083 商品与活动实例 B" status="READY" />
            <NodeStatus name="order" detail="8082 秒杀下单" status="READY" />
            <NodeStatus name="stock" detail="8084 Redis 库存扣减" status="READY" />
            <NodeStatus name="BI Service" detail="8000 LightGBM / SHAP" status="READY" />
          </div>
        </aside>

        <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <BIDashboard />
        </section>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-6 md:grid-cols-3">
        <ArchitectureCard title="优势 1：横向扩展" value="goods 双实例" detail="商品查询是秒杀入口高频读请求，拆成 goods / goods-2 后可通过 Nginx 与 Gateway 分摊压力。" />
        <ArchitectureCard title="优势 2：状态外置" value="Redis" detail="库存、熵矩阵、意愿分和令牌桶放到 Redis，服务实例可以无状态扩容。" />
        <ArchitectureCard title="优势 3：削峰解耦" value="RabbitMQ" detail="订单链路可以异步化，避免瞬时流量直接压垮数据库和支付状态机。" />
      </section>
    </main>
  )
}

function Kpi({ title, value, note, tone = 'green' }: { title: string; value: string; note: string; tone?: 'green' | 'red' | 'amber' }) {
  const toneClass = {
    green: 'text-emerald-300',
    red: 'text-red-300',
    amber: 'text-amber-300',
  }[tone]

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">{note}</p>
    </div>
  )
}

function MiniKpi({ label, value, tone = 'green' }: { label: string; value: string; tone?: 'green' | 'red' }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone === 'red' ? 'text-red-300' : 'text-emerald-300'}`}>{value}</p>
    </div>
  )
}

function actionText(action: DemoEvent['action']) {
  const labels: Record<DemoEvent['action'], string> = {
    BROWSE: '浏览',
    FAVORITE: '收藏',
    ADD_TO_CART: '加购',
    SECKILL: '秒杀',
    PAY: '支付',
  }
  return labels[action]
}

function trafficTone(color: DemoEvent['color']) {
  if (color === 'BLACK') return 'bg-red-400/10 text-red-200'
  if (color === 'YELLOW') return 'bg-amber-400/10 text-amber-200'
  return 'bg-emerald-400/10 text-emerald-200'
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function ArchitectureCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-cyan-200">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </section>
  )
}

function NodeStatus({ name, detail, status }: { name: string; detail: string; status: string }) {
  const isDemo = status === 'DEMO'
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-100">{name}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDemo ? 'bg-amber-400/10 text-amber-200' : 'bg-emerald-400/10 text-emerald-200'}`}>
          {status}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  )
}
