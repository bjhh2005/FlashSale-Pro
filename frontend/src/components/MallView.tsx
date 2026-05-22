import { Fragment, useEffect, useMemo, useState } from 'react'
import { createOrder, fetchUserOrders, payOrder, type FlashSaleOrder } from '../api/order'
import { postJson } from '../api/client'
import { fetchFlashSaleItems, type FlashSaleItem } from '../api/flashSale'
import { pushDemoEvent, resetDemoEvents, type DemoAction, type DemoEvent, type DemoEventResult } from '../demoBus'

type TrafficColor = 'GREEN' | 'YELLOW' | 'BLACK'
type BehaviorAction = 'BROWSE' | 'FAVORITE' | 'ADD_TO_CART' | 'SECKILL'
type EntropyState = 'DETAIL' | 'FAV' | 'CART' | 'SECKILL'
type Category = 'all' | 'digital' | 'home' | 'sports' | 'beauty'
type RiskMode = 'normal' | 'hot' | 'bot'

interface DemoProduct {
  id: number
  itemId: number
  eventId: number
  name: string
  subtitle: string
  category: Exclude<Category, 'all'>
  image: string
  flashPrice: number
  originalPrice: number
  availableStock: number
  totalStock: number
  heat: number
  color: TrafficColor
  tag: string
  seller: string
  logistics: string
  perUserLimit: number
  serviceBadges: string[]
  coupon: number
  recommendReason: string
}

interface BehaviorLog {
  id: number
  action: BehaviorAction
  productName: string
  color: TrafficColor
  entropy: number
  matrix: number[][]
  reason: string
  latency: number
  time: string
  stage: string
  result: DemoEventResult
  stockBefore: number
  stockAfter: number
}

interface CartLine {
  productId: number
  quantity: number
}

const demoProducts: DemoProduct[] = [
  {
    id: 101,
    itemId: 9001,
    eventId: 1,
    name: 'AirLite Pro 降噪耳机',
    subtitle: '低延迟游戏模式，适合演示高并发抢购',
    category: 'digital',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    flashPrice: 199,
    originalPrice: 499,
    availableStock: 86,
    totalStock: 300,
    heat: 92,
    color: 'GREEN',
    tag: '高转化',
    seller: 'Flash 自营数码',
    logistics: '预计 24 小时内发货',
    perUserLimit: 1,
    serviceBadges: ['7 天无理由', '自营质保', '整点秒杀'],
    coupon: 30,
    recommendReason: '你最近浏览过耳机类商品，系统提升了推荐权重。',
  },
  {
    id: 102,
    itemId: 9002,
    eventId: 1,
    name: 'NeoPad 11 学习平板',
    subtitle: '库存紧张，可演示库存扣减与黄灯策略',
    category: 'digital',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
    flashPrice: 1299,
    originalPrice: 2199,
    availableStock: 34,
    totalStock: 120,
    heat: 81,
    color: 'YELLOW',
    tag: '观察中',
    seller: 'Neo 智能旗舰店',
    logistics: '同城仓优先出库',
    perUserLimit: 1,
    serviceBadges: ['学生优惠', '一年保修', '库存预热'],
    coupon: 100,
    recommendReason: '该商品转化率高，网关会持续观察请求熵。',
  },
  {
    id: 103,
    itemId: 9003,
    eventId: 1,
    name: 'FlashBand 运动手环',
    subtitle: '高频点击样本，适合触发行为埋点对比',
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=900&q=80',
    flashPrice: 79,
    originalPrice: 199,
    availableStock: 156,
    totalStock: 500,
    heat: 68,
    color: 'GREEN',
    tag: '新人券',
    seller: 'Flash 运动馆',
    logistics: '次日达覆盖 120 城',
    perUserLimit: 2,
    serviceBadges: ['健康监测', '新人补贴', '低价引流'],
    coupon: 20,
    recommendReason: '低价商品适合作为流量入口，观察加购到下单漏斗。',
  },
  {
    id: 104,
    itemId: 9004,
    eventId: 2,
    name: 'MistPure 空气净化器',
    subtitle: '家电专场爆品，可讲多品类活动编排',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
    flashPrice: 699,
    originalPrice: 1299,
    availableStock: 58,
    totalStock: 180,
    heat: 76,
    color: 'GREEN',
    tag: '家电专场',
    seller: 'HomeLab 自营',
    logistics: '大件送装一体',
    perUserLimit: 1,
    serviceBadges: ['送装一体', '以旧换新', '家庭推荐'],
    coupon: 80,
    recommendReason: '家庭用户画像命中，适合展示个性化推荐。',
  },
  {
    id: 105,
    itemId: 9005,
    eventId: 2,
    name: 'Luna Glow 护肤套装',
    subtitle: '女性用户高收藏款，可演示人群分层',
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80',
    flashPrice: 159,
    originalPrice: 399,
    availableStock: 19,
    totalStock: 90,
    heat: 88,
    color: 'YELLOW',
    tag: '即将售罄',
    seller: 'Luna 官方旗舰店',
    logistics: '保税仓直发',
    perUserLimit: 1,
    serviceBadges: ['正品溯源', '收藏高', '限时券'],
    coupon: 40,
    recommendReason: '收藏行为密集，BI 侧能看到意向用户聚类。',
  },
  {
    id: 106,
    itemId: 9006,
    eventId: 3,
    name: 'BrewGo 便携咖啡机',
    subtitle: '尾场补贴款，可演示转化召回与优惠券',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80',
    flashPrice: 269,
    originalPrice: 599,
    availableStock: 72,
    totalStock: 220,
    heat: 64,
    color: 'GREEN',
    tag: '尾场补贴',
    seller: 'BrewGo 生活馆',
    logistics: '顺丰包邮',
    perUserLimit: 2,
    serviceBadges: ['尾场召回', '包邮', '直播同款'],
    coupon: 50,
    recommendReason: '低库存压力小，适合演示兜底演示态下单。',
  },
]

const actionLabel: Record<BehaviorAction, string> = {
  BROWSE: '浏览',
  FAVORITE: '收藏',
  ADD_TO_CART: '加购',
  SECKILL: '秒杀',
}

const categoryLabel: Record<Category, string> = {
  all: '全部',
  digital: '数码',
  home: '家居',
  sports: '运动',
  beauty: '美妆',
}

const colorClass: Record<TrafficColor, string> = {
  GREEN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  YELLOW: 'border-amber-200 bg-amber-50 text-amber-700',
  BLACK: 'border-red-200 bg-red-50 text-red-700',
}

const riskLabel: Record<RiskMode, string> = {
  normal: '普通用户',
  hot: '高意向用户',
  bot: '疑似脚本',
}

const riskDescription: Record<RiskMode, string> = {
  normal: '行为节奏稳定，请求正常进入秒杀链路。',
  hot: '收藏和加购更多，推荐与转化指标会快速上升。',
  bot: '高频低熵请求，页面会标记黑流量并解释网关拦截点。',
}

const eventTabs = [
  { id: 1, name: '20:00 爆品开抢', status: '进行中' },
  { id: 2, name: '21:00 家居美妆', status: '预热中' },
  { id: 3, name: '22:00 尾场补贴', status: '待开始' },
]

function nowTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 0,
  }).format(value)
}

const entropyStates: EntropyState[] = ['DETAIL', 'FAV', 'CART', 'SECKILL']

const actionToState: Record<BehaviorAction, EntropyState> = {
  BROWSE: 'DETAIL',
  FAVORITE: 'FAV',
  ADD_TO_CART: 'CART',
  SECKILL: 'SECKILL',
}

function buildTransitionMatrix(states: EntropyState[]) {
  const matrix = entropyStates.map(() => entropyStates.map(() => 0))
  for (let index = 1; index < states.length; index += 1) {
    const from = entropyStates.indexOf(states[index - 1])
    const to = entropyStates.indexOf(states[index])
    if (from >= 0 && to >= 0) matrix[from][to] += 1
  }
  return matrix
}

function computeConditionalEntropy(matrix: number[][]) {
  const rowSums = matrix.map((row) => row.reduce((sum, value) => sum + value, 0))
  const total = rowSums.reduce((sum, value) => sum + value, 0)
  if (total === 0) return 2

  return matrix.reduce((h, row, rowIndex) => {
    const rowSum = rowSums[rowIndex]
    if (rowSum === 0) return h
    const px = rowSum / total
    const conditionalH = row.reduce((sum, value) => {
      if (value === 0) return sum
      const p = value / rowSum
      return sum - p * Math.log2(p)
    }, 0)
    return h + px * conditionalH
  }, 0)
}

function classifyEntropy(entropy: number): TrafficColor {
  if (entropy < 0.5) return 'BLACK'
  if (entropy < 1.5 || entropy > 3.5) return 'YELLOW'
  return 'GREEN'
}

function explainEntropy(color: TrafficColor, entropy: number, repeatedCount: number) {
  if (color === 'BLACK') {
    return `H=${entropy.toFixed(2)}，最近行为高度重复，转移路径几乎确定，判定为低熵黑流量`
  }
  if (color === 'YELLOW') {
    return `H=${entropy.toFixed(2)}，行为路径偏单一，进入降级观察`
  }
  if (repeatedCount >= 3) {
    return `H=${entropy.toFixed(2)}，出现重复点击但仍未低于黑流量阈值`
  }
  return `H=${entropy.toFixed(2)}，行为路径多样，符合正常用户`
}

function makeDemoOrder(product: DemoProduct, userId: number): FlashSaleOrder {
  return {
    id: `DEMO-${Date.now().toString().slice(-6)}`,
    userId,
    eventId: product.eventId,
    itemId: product.itemId,
    productId: product.id,
    quantity: 1,
    orderStatus: 'PENDING_PAYMENT',
    totalAmount: Math.max(0, product.flashPrice - product.coupon),
    createdAt: new Date().toISOString(),
    paidAt: null,
  }
}

function buildStage(action: BehaviorAction, color: TrafficColor, result: DemoEventResult) {
  if (result === 'BLOCKED') return 'Gateway 拦截黑流量，订单服务未承压'
  if (action === 'SECKILL') return 'Gateway 放行 → Redis 扣库存 → Order 落库'
  if (action === 'ADD_TO_CART') return '行为埋点进入特征矩阵，加购权重上升'
  if (action === 'FAVORITE') return '收藏行为进入 BI，购买意愿分上升'
  if (color === 'YELLOW') return 'Gateway 标记 YELLOW，进入降级观察'
  return '行为事件已采集，管理员侧实时可见'
}

function mapApiItems(items: FlashSaleItem[]): DemoProduct[] {
  return items.map((item, index) => {
    const fallback = demoProducts[index % demoProducts.length]
    const totalStock = Number(item.totalStock ?? item.availableStock ?? fallback.totalStock)
    const availableStock = Number(item.availableStock ?? totalStock)
    const soldRatio = totalStock > 0 ? 1 - availableStock / totalStock : 0
    const color: TrafficColor = soldRatio > 0.84 ? 'YELLOW' : 'GREEN'
    const flashPrice = Number(item.flashPrice ?? fallback.flashPrice)
    return {
      ...fallback,
      id: Number(item.productId ?? fallback.id),
      itemId: Number(item.id),
      eventId: Number(item.eventId ?? fallback.eventId),
      subtitle: `活动 ${item.eventId ?? fallback.eventId} · 每人限购 ${item.perUserLimit ?? fallback.perUserLimit} 件`,
      flashPrice,
      originalPrice: Math.round(flashPrice * 1.8),
      availableStock,
      totalStock,
      heat: Math.min(99, Math.round(soldRatio * 100) + 35),
      color,
      tag: color === 'GREEN' ? '可抢购' : '库存紧张',
      perUserLimit: Number(item.perUserLimit ?? fallback.perUserLimit),
    }
  })
}

export default function MallView() {
  const [products, setProducts] = useState<DemoProduct[]>(demoProducts)
  const [userId, setUserId] = useState(10001)
  const [selectedId, setSelectedId] = useState(demoProducts[0].id)
  const [activeEventId, setActiveEventId] = useState(1)
  const [category, setCategory] = useState<Category>('all')
  const [riskMode, setRiskMode] = useState<RiskMode>('normal')
  const [cart, setCart] = useState<CartLine[]>([])
  const [favoriteIds, setFavoriteIds] = useState<number[]>([101])
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLog[]>([
    {
      id: 1,
      action: 'BROWSE',
      productName: demoProducts[0].name,
      color: 'GREEN',
      entropy: 2.74,
      matrix: buildTransitionMatrix(['DETAIL', 'FAV', 'CART']),
      reason: 'H=2.74，行为路径多样，符合正常用户',
      latency: 42,
      time: nowTime(),
      stage: '行为事件已采集，管理员侧实时可见',
      result: 'CAPTURED',
      stockBefore: demoProducts[0].availableStock,
      stockAfter: demoProducts[0].availableStock,
    },
  ])
  const [orderResult, setOrderResult] = useState('等待用户发起秒杀')
  const [highlightedMetric, setHighlightedMetric] = useState('等待操作')
  const [behaviorSequence, setBehaviorSequence] = useState<EntropyState[]>(['DETAIL', 'FAV', 'CART'])
  const [routeTrace, setRouteTrace] = useState([
    { name: 'Mall', detail: '等待用户点击', state: 'idle' },
    { name: 'Gateway', detail: '统一入口', state: 'idle' },
    { name: 'Redis', detail: '库存令牌', state: 'idle' },
    { name: 'Order', detail: '订单状态机', state: 'idle' },
    { name: 'Admin', detail: '等待事件同步', state: 'idle' },
  ])
  const [isOrdering, setIsOrdering] = useState(false)
  const [apiState, setApiState] = useState<'online' | 'demo' | 'loading'>('loading')
  const [orders, setOrders] = useState<FlashSaleOrder[]>([])

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? products[0],
    [products, selectedId],
  )

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const eventMatched = product.eventId === activeEventId
        const categoryMatched = category === 'all' || product.category === category
        return eventMatched && categoryMatched
      }),
    [activeEventId, category, products],
  )

  const cartProducts = useMemo(
    () =>
      cart
        .map((line) => {
          const product = products.find((item) => item.id === line.productId)
          return product ? { product, quantity: line.quantity } : null
        })
        .filter((line): line is { product: DemoProduct; quantity: number } => Boolean(line)),
    [cart, products],
  )

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartSubtotal = cartProducts.reduce(
    (sum, line) => sum + Math.max(0, line.product.flashPrice - line.product.coupon) * line.quantity,
    0,
  )
  const totalStock = visibleProducts.reduce((sum, item) => sum + item.totalStock, 0)
  const totalAvailable = visibleProducts.reduce((sum, item) => sum + item.availableStock, 0)
  const sellThrough = totalStock > 0 ? Math.round((1 - totalAvailable / totalStock) * 100) : 0
  const yellowCount = behaviorLogs.filter((log) => log.color === 'YELLOW').length
  const blackCount = behaviorLogs.filter((log) => log.color === 'BLACK').length
  const seckillLogs = behaviorLogs.filter((log) => log.action === 'SECKILL' && log.result !== 'BLOCKED').length
  const paidOrders = orders.filter((order) => order.orderStatus === 'PAID' || Boolean(order.paidAt)).length
  const demoRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0)
  const intentScore = Math.min(
    98,
    52 + behaviorLogs.length * 4 + cartCount * 8 + favoriteIds.length * 5 + seckillLogs * 7 + paidOrders * 4 + (riskMode === 'hot' ? 12 : 0),
  )
  const conversionRate = Math.min(96, Math.round((cartCount + 1) * 10 + favoriteIds.length * 4 + behaviorLogs.length * 1.5))
  const riskScore = Math.min(99, Math.round((yellowCount * 18 + blackCount * 35 + (riskMode === 'bot' ? 42 : 8))))
  const traceTone = riskScore > 55 ? 'red' : riskScore > 28 ? 'amber' : 'green'

  useEffect(() => {
    let alive = true
    fetchFlashSaleItems(1)
      .then((res) => {
        if (!alive) return
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = mapApiItems(res.data)
          const merged = [...mapped, ...demoProducts.filter((item) => !mapped.some((apiItem) => apiItem.id === item.id))]
          setProducts(merged)
          setSelectedId(merged[0].id)
          setApiState('online')
        } else {
          setApiState('demo')
        }
      })
      .catch(() => {
        if (alive) setApiState('demo')
      })
    return () => {
      alive = false
    }
  }, [])

  const syncDemoEvent = (
    action: DemoAction,
    product: DemoProduct,
    color: TrafficColor,
    entropy: number,
    matrix: number[][],
    reason: string,
    latency: number,
    result: DemoEventResult,
    stockBefore: number,
    stockAfter: number,
  ) => {
    const event: DemoEvent = {
      id: Date.now(),
      time: nowTime(),
      userId,
      productId: product.id,
      itemId: product.itemId,
      eventId: product.eventId,
      productName: product.name,
      action,
      color,
      entropy,
      matrix,
      reason,
      latency,
      amount: action === 'SECKILL' || action === 'PAY' ? Math.max(0, product.flashPrice - product.coupon) : 0,
      stockBefore,
      stockAfter,
      result,
    }
    pushDemoEvent(event)
  }

  const updateRouteTrace = (action: BehaviorAction, color: TrafficColor, result: DemoEventResult) => {
    const blocked = result === 'BLOCKED'
    setRouteTrace([
      { name: 'Mall', detail: `${actionLabel[action]}事件发起`, state: 'done' },
      { name: 'Gateway', detail: blocked ? 'EntropyFilter 判定 BLACK' : `${color} 流量放行`, state: blocked ? 'blocked' : 'done' },
      { name: 'Redis', detail: action === 'SECKILL' && !blocked ? '库存原子扣减 -1' : '记录行为热度', state: blocked ? 'idle' : 'done' },
      { name: 'Order', detail: action === 'SECKILL' && !blocked ? '生成待支付订单' : blocked ? '未创建订单' : '等待转化', state: blocked ? 'idle' : 'done' },
      { name: 'Admin', detail: 'KPI、事件流、漏斗同步刷新', state: 'done' },
    ])
  }

  const trackBehavior = async (
    action: BehaviorAction,
    product: DemoProduct,
    options?: { result?: DemoEventResult; stockBefore?: number; stockAfter?: number },
  ) => {
    const nextState = actionToState[action]
    const nextSequence: EntropyState[] =
      riskMode === 'bot'
        ? [...behaviorSequence, 'SECKILL' as EntropyState, 'SECKILL' as EntropyState, 'SECKILL' as EntropyState, nextState].slice(-12)
        : [...behaviorSequence, nextState].slice(-12)
    const matrix = buildTransitionMatrix(nextSequence)
    const repeatedCount = nextSequence.slice(-5).filter((state) => state === nextState).length
    const rawEntropy = computeConditionalEntropy(matrix)
    const entropy = Number(rawEntropy.toFixed(2))
    let color: TrafficColor = classifyEntropy(rawEntropy)
    if (repeatedCount >= 4) color = 'BLACK'
    const reason = explainEntropy(color, entropy, repeatedCount)
    const latency = Math.round((riskMode === 'bot' ? 18 : 42) + Math.random() * 90)
    const result = options?.result ?? (color === 'BLACK' ? 'BLOCKED' : action === 'SECKILL' ? 'CONVERTED' : 'CAPTURED')
    const stockBefore = options?.stockBefore ?? product.availableStock
    const stockAfter = options?.stockAfter ?? product.availableStock
    const stage = buildStage(action, color, result)
    setBehaviorSequence(nextSequence)

    setBehaviorLogs((logs) => [
      {
        id: Date.now(),
        action,
        productName: product.name,
        color,
        entropy,
        matrix,
        reason,
        latency,
        time: nowTime(),
        stage,
        result,
        stockBefore,
        stockAfter,
      },
      ...logs,
    ].slice(0, 10))
    setHighlightedMetric(stage)
    updateRouteTrace(action, color, result)
    syncDemoEvent(action, product, color, entropy, matrix, reason, latency, result, stockBefore, stockAfter)

    try {
      await postJson('/api/behavior/event', {
        userId,
        productId: product.id,
        itemId: product.itemId,
        eventId: product.eventId,
        action: action === 'SECKILL' ? 'PURCHASE' : action,
        dwellSeconds: action === 'BROWSE' ? 12 : undefined,
        extra: JSON.stringify({ entropy, color, result, stockBefore, stockAfter, matrix, sequence: nextSequence }),
      })
    } catch {
      setApiState((state) => (state === 'online' ? 'online' : 'demo'))
    }

    return { color, entropy, matrix, reason, result }
  }

  const handleFavorite = async (product: DemoProduct) => {
    setFavoriteIds((ids) => (ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id]))
    await trackBehavior('FAVORITE', product)
  }

  const handleAddCart = async (product: DemoProduct) => {
    setCart((lines) => {
      const existed = lines.find((line) => line.productId === product.id)
      if (existed) {
        return lines.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(product.perUserLimit, line.quantity + 1) }
            : line,
        )
      }
      return [...lines, { productId: product.id, quantity: 1 }]
    })
    await trackBehavior('ADD_TO_CART', product)
  }

  const applyDemoStockChange = (product: DemoProduct) => {
    const stockAfter = Math.max(0, product.availableStock - 1)
    setProducts((list) =>
      list.map((item) =>
        item.id === product.id
          ? {
              ...item,
              availableStock: stockAfter,
              heat: Math.min(99, item.heat + 6),
              color: stockAfter / Math.max(1, item.totalStock) < 0.15 ? 'YELLOW' : item.color,
              tag: stockAfter / Math.max(1, item.totalStock) < 0.15 ? '即将售罄' : '刚刚成交',
            }
          : item,
      ),
    )
  }

  const handleSeckill = async (product: DemoProduct) => {
    setSelectedId(product.id)
    setIsOrdering(true)
    setOrderResult('Gateway 正在通过 EntropyFilter / PID / AuthFilter 处理请求')
    const stockBefore = product.availableStock
    const stockAfter = Math.max(0, stockBefore - 1)

    if (riskMode === 'bot') {
      await trackBehavior('SECKILL', product, { result: 'BLOCKED', stockBefore, stockAfter: stockBefore })
      setOrderResult('疑似脚本流量：EntropyFilter 标记 BLACK，演示为网关侧拦截')
      setHighlightedMetric('黑流量被拦截：库存不变、订单不创建、管理员侧 BLACK 指标上升')
      setIsOrdering(false)
      return
    }

    const tracked = await trackBehavior('SECKILL', product, { stockBefore, stockAfter })
    if (tracked.result === 'BLOCKED') {
      setOrderResult('普通用户出现高频重复秒杀：条件熵降为 BLACK，库存不变、订单不创建')
      setIsOrdering(false)
      return
    }
    applyDemoStockChange(product)
    const optimisticOrder = makeDemoOrder(product, userId)
    setOrders((list) => [optimisticOrder, ...list].slice(0, 5))
    setOrderResult(`演示链路已完成：库存 ${stockBefore} → ${stockAfter}，订单 ${String(optimisticOrder.id)} 待支付`)

    try {
      const res = await createOrder({ userId, itemId: product.itemId, quantity: 1 })
      if (res.ok) {
        const order = res.data as FlashSaleOrder | null
        setOrderResult(`真实接口下单成功：订单 ${String(order?.id ?? optimisticOrder.id)}，管理员侧事件已同步`)
        setApiState('online')
        if (order) setOrders((list) => [order, ...list.filter((item) => item.id !== optimisticOrder.id)].slice(0, 5))
      } else {
        setOrderResult(`接口返回 ${res.status}，页面保留演示订单用于路演串讲`)
        setApiState('demo')
      }
    } catch {
      setOrderResult('后端未启动或限流，已保留演示态：库存、订单和管理员大屏仍会联动')
      setApiState('demo')
    } finally {
      setIsOrdering(false)
    }
  }

  const handleLoadOrders = async () => {
    try {
      const res = await fetchUserOrders(userId)
      if (res.ok && Array.isArray(res.data)) {
        setOrders(res.data)
        setApiState('online')
      } else {
        setOrderResult('订单查询接口暂不可用，页面保留最近一次演示订单')
      }
    } catch {
      setApiState('demo')
      setOrderResult('订单查询失败：可继续使用前端演示态讲解')
    }
  }

  const handlePay = async (orderId: number | string) => {
    const target = orders.find((order) => String(order.id) === String(orderId))
    const product = products.find((item) => String(item.itemId) === String(target?.itemId)) ?? selectedProduct
    const payMatrix = buildTransitionMatrix([...behaviorSequence, 'SECKILL' as EntropyState].slice(-12))
    syncDemoEvent('PAY', product, 'GREEN', 2.88, payMatrix, '支付完成，订单状态进入 PAID，GMV 计入管理端', 36, 'PAID', product.availableStock, product.availableStock)
    setHighlightedMetric('支付完成：GMV 增加，管理员侧转化漏斗进入已支付阶段')
    try {
      const res = await payOrder(orderId)
      if (res.ok) {
        setOrders((list) =>
          list.map((order) =>
            String(order.id) === String(orderId)
              ? { ...order, orderStatus: 'PAID', paidAt: new Date().toISOString() }
              : order,
          ),
        )
        setOrderResult(`订单 ${String(orderId)} 支付成功，订单状态已更新`)
      } else {
        setOrders((list) =>
          list.map((order) =>
            String(order.id) === String(orderId)
              ? { ...order, orderStatus: 'PAID', paidAt: new Date().toISOString() }
              : order,
          ),
        )
        setOrderResult(`支付接口返回 ${res.status}，页面已按演示态更新支付结果`)
      }
    } catch {
      setOrders((list) =>
        list.map((order) =>
          String(order.id) === String(orderId)
            ? { ...order, orderStatus: 'PAID', paidAt: new Date().toISOString() }
            : order,
        ),
      )
      setOrderResult('支付接口未连通，已按演示态完成订单支付状态机')
    }
  }

  const handleResetDemo = () => {
    resetDemoEvents()
    setProducts(demoProducts)
    setSelectedId(demoProducts[0].id)
    setCart([])
    setFavoriteIds([101])
    setOrders([])
    setBehaviorLogs([
      {
        id: 1,
        action: 'BROWSE',
        productName: demoProducts[0].name,
        color: 'GREEN',
        entropy: 2.74,
        matrix: buildTransitionMatrix(['DETAIL', 'FAV', 'CART']),
        reason: 'H=2.74，行为路径多样，符合正常用户',
        latency: 42,
        time: nowTime(),
        stage: '行为事件已采集，管理员侧实时可见',
        result: 'CAPTURED',
        stockBefore: demoProducts[0].availableStock,
        stockAfter: demoProducts[0].availableStock,
      },
    ])
    setBehaviorSequence(['DETAIL', 'FAV', 'CART'])
    setRouteTrace([
      { name: 'Mall', detail: '等待用户点击', state: 'idle' },
      { name: 'Gateway', detail: '统一入口', state: 'idle' },
      { name: 'Redis', detail: '库存令牌', state: 'idle' },
      { name: 'Order', detail: '订单状态机', state: 'idle' },
      { name: 'Admin', detail: '等待事件同步', state: 'idle' },
    ])
    setOrderResult('演示已重置，可以从浏览、收藏、加购、秒杀重新开始')
    setHighlightedMetric('等待操作')
    setApiState('demo')
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusPill text="/mall 用户侧" tone="dark" />
                <StatusPill text="埋点采集 + 秒杀下单 + 风控染色" tone="green" />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    apiState === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {apiState === 'loading' ? '连接后端中' : apiState === 'online' ? '真实接口在线' : '演示数据模式'}
                </span>
              </div>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                FlashSale 用户秒杀商城
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                这一屏可以直接用于路演：从活动场次、用户画像、商品推荐、购物车、秒杀请求到网关风控和订单状态，完整串起消费者侧体验与后端架构能力。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="购买意愿分" value={`${intentScore}`} suffix="/100" />
              <Metric label="预计转化" value={`${conversionRate}`} suffix="%" />
              <Metric label="售罄进度" value={`${sellThrough}`} suffix="%" />
              <Metric label="风险分" value={`${riskScore}`} suffix="/100" tone={riskScore > 55 ? 'red' : 'green'} />
            </div>
            <div className={`rounded-lg border px-4 py-3 text-sm ${
              traceTone === 'red'
                ? 'border-red-200 bg-red-50 text-red-700'
                : traceTone === 'amber'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              <span className="font-semibold">当前可讲变化：</span>
              {highlightedMetric}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">当前用户</p>
                <p className="text-lg font-semibold">User #{userId}</p>
              </div>
              <label className="text-xs text-slate-300">
                切换用户
                <input
                  type="number"
                  value={userId}
                  onChange={(event) => setUserId(Number(event.target.value))}
                  className="mt-1 w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white outline-none focus:border-emerald-400"
                />
              </label>
            </div>
            <div className="grid gap-2">
              {(['normal', 'hot', 'bot'] as RiskMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRiskMode(mode)}
                  className={`rounded-md border px-3 py-2 text-left text-xs transition ${
                    riskMode === mode
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block font-semibold">{riskLabel[mode]}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">{riskDescription[mode]}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs font-medium text-slate-300">最近请求结果</p>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-100">{orderResult}</p>
            </div>
            <button
              type="button"
              onClick={handleResetDemo}
              className="mt-3 w-full rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              重置路演数据
            </button>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">今日秒杀场</h2>
                <p className="mt-1 text-xs text-slate-500">活动切换会影响商品、库存、推荐与演示叙事。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {eventTabs.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setActiveEventId(event.id)}
                    className={`rounded-md border px-3 py-2 text-left text-xs transition ${
                      activeEventId === event.id
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block font-semibold">{event.name}</span>
                    <span className="text-[11px] opacity-75">{event.status}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryLabel) as Category[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    category === item
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {categoryLabel[item]}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => {
              const progress = Math.round(((product.totalStock - product.availableStock) / product.totalStock) * 100)
              const isSelected = product.id === selectedProduct.id
              const isFavorite = favoriteIds.includes(product.id)
              return (
                <article
                  key={product.id}
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
                  onMouseEnter={() => setSelectedId(product.id)}
                >
                  <button type="button" onClick={() => setSelectedId(product.id)} className="block w-full text-left">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-white">
                        {product.tag}
                      </div>
                      <div className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[11px] ${colorClass[product.color]}`}>
                        {product.color}
                      </div>
                    </div>
                  </button>
                  <div className="p-4">
                    <div className="min-h-20">
                      <h3 className="font-semibold text-slate-950">{product.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{product.subtitle}</p>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-red-600">¥{formatMoney(product.flashPrice)}</span>
                          <span className="text-sm text-slate-400 line-through">¥{formatMoney(product.originalPrice)}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">券后 ¥{formatMoney(product.flashPrice - product.coupon)}</p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">热度 {product.heat}</span>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>剩余 {product.availableStock} 件</span>
                        <span>已售 {product.totalStock - product.availableStock} 件</span>
                        <span>限购 {product.perUserLimit} 件</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.max(8, progress)}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <ActionButton label="看" title="浏览商品" onClick={() => trackBehavior('BROWSE', product)} />
                      <ActionButton label={isFavorite ? '已藏' : '藏'} title="收藏商品" onClick={() => handleFavorite(product)} />
                      <ActionButton label="车" title="加入购物车" onClick={() => handleAddCart(product)} />
                      <button
                        type="button"
                        onClick={() => handleSeckill(product)}
                        disabled={isOrdering || product.availableStock <= 0}
                        className="rounded-md bg-red-600 px-2 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {isOrdering && isSelected ? '提交' : '秒杀'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {visibleProducts.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              当前场次没有这个分类的商品，切换分类或场次继续演示。
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950">实时链路追踪</h2>
              <span className="text-xs text-slate-500">用户侧 → 管理员侧</span>
            </div>
            <div className="space-y-2">
              {routeTrace.map((step) => (
                <div key={step.name} className="grid grid-cols-[72px_1fr] gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <span className={`font-semibold ${
                    step.state === 'blocked' ? 'text-red-600' : step.state === 'done' ? 'text-emerald-600' : 'text-slate-400'
                  }`}>
                    {step.name}
                  </span>
                  <span className="text-slate-600">{step.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <img src={selectedProduct.image} alt={selectedProduct.name} className="h-24 w-24 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">商品详情</p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">{selectedProduct.name}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{selectedProduct.recommendReason}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <InfoLine label="商家" value={selectedProduct.seller} />
              <InfoLine label="物流" value={selectedProduct.logistics} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProduct.serviceBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                  {badge}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950">购物车与优惠</h2>
              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">{cartCount} 件</span>
            </div>
            {cartProducts.length === 0 ? (
              <p className="text-xs leading-5 text-slate-500">先点击商品卡片里的“车”，路演时可以展示加购如何提高购买意愿分。</p>
            ) : (
              <div className="space-y-2">
                {cartProducts.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs">
                    <span className="min-w-0 truncate font-medium text-slate-700">{product.name}</span>
                    <span className="shrink-0 text-slate-500">x{quantity}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">券后小计</span>
                  <span className="font-bold text-red-600">¥{formatMoney(cartSubtotal)}</span>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950">埋点队列</h2>
              <span className="text-xs text-slate-500">/api/behavior/event</span>
            </div>
            <div className="space-y-2">
              {behaviorLogs.map((log) => (
                <div key={log.id} className="grid grid-cols-[62px_1fr_64px] items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-medium text-slate-500">{log.time}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {actionLabel[log.action]} · {log.productName}
                    </p>
                    <p className="text-[11px] text-slate-500">H(Y|X)={log.entropy} · {log.latency}ms</p>
                    <p className="truncate text-[11px] text-slate-400">{log.reason}</p>
                    <p className="truncate text-[11px] text-slate-400">{log.stage}</p>
                    {log.stockBefore !== log.stockAfter && (
                      <p className="text-[11px] font-medium text-red-500">库存 {log.stockBefore} → {log.stockAfter}</p>
                    )}
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-center text-[10px] ${colorClass[log.color]}`}>
                    {log.color}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950">订单状态</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-600">GMV ¥{formatMoney(demoRevenue)}</span>
                <button type="button" onClick={handleLoadOrders} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                  刷新
                </button>
              </div>
            </div>
            {orders.length === 0 ? (
              <p className="text-xs leading-5 text-slate-500">完成一次秒杀后，这里会展示订单 ID、支付状态和支付动作。</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => {
                  const paid = order.orderStatus === 'PAID' || Boolean(order.paidAt)
                  return (
                    <div key={String(order.id)} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">订单 {String(order.id)}</span>
                        <span className={paid ? 'text-emerald-600' : 'text-amber-600'}>{paid ? '已支付' : '待支付'}</span>
                      </div>
                      <p className="mt-1 text-slate-500">金额 ¥{String(order.totalAmount ?? selectedProduct.flashPrice)} · 数量 {String(order.quantity ?? 1)}</p>
                      {!paid && (
                        <button type="button" onClick={() => handlePay(order.id)} className="mt-2 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-medium text-white">
                          支付
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">路演讲解链路</h2>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              {[
                ['1', '用户浏览 / 收藏 / 加购，产生行为事件'],
                ['2', 'Nginx 转发到 Gateway，统一入口鉴权'],
                ['3', 'EntropyFilter 根据请求熵给流量染色'],
                ['4', 'PID 自适应限流保护订单服务'],
                ['5', 'Redis 原子扣库存，订单服务落库'],
                ['6', 'BI 大屏展示转化、风险与流量趋势'],
              ].map(([index, step]) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] text-white">{index}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">条件熵转移矩阵</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">行是上一次行为，列是下一次行为。重复点击会让矩阵集中到一条路径，H(Y|X) 下降并触发 BLACK。</p>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px]">
              <span />
              {entropyStates.map((state) => <span key={state} className="rounded bg-slate-100 px-1 py-1 text-slate-500">{state}</span>)}
              {(behaviorLogs[0]?.matrix ?? buildTransitionMatrix(behaviorSequence)).map((row, rowIndex) => (
                <Fragment key={`matrix-row-${entropyStates[rowIndex]}`}>
                  <span key={`row-${entropyStates[rowIndex]}`} className="rounded bg-slate-100 px-1 py-1 font-semibold text-slate-500">{entropyStates[rowIndex]}</span>
                  {row.map((value, colIndex) => (
                    <span key={`${rowIndex}-${colIndex}`} className={`rounded px-1 py-1 font-mono ${value > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-300'}`}>{value}</span>
                  ))}
                </Fragment>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

function StatusPill({ text, tone }: { text: string; tone: 'dark' | 'green' }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        tone === 'dark' ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {text}
    </span>
  )
}

function Metric({ label, value, suffix, tone = 'dark' }: { label: string; value: string; suffix: string; tone?: 'dark' | 'green' | 'red' }) {
  const toneClass = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-950'
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>
        {value}
        <span className="ml-1 text-sm font-medium text-slate-500">{suffix}</span>
      </p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate font-medium text-slate-700">{value}</p>
    </div>
  )
}

function ActionButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      {label}
    </button>
  )
}
