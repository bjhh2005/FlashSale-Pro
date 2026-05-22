import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import MallView from './components/MallView'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
              FS
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">FlashSale-Pro</p>
              <p className="text-[11px] text-slate-500">秒杀商城与风控 BI 展示</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
            <NavLink
              to="/mall"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 font-medium transition ${
                  isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              用户侧商城
            </NavLink>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 font-medium transition ${
                  isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              管理员 BI 大屏
            </NavLink>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/mall" replace />} />
        <Route path="/mall" element={<MallView />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
