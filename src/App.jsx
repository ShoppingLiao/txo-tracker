import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useFirestoreSync } from './hooks/useFirestoreSync'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Monthly from './pages/Monthly'
import Yearly from './pages/Yearly'
import Guide from './pages/Guide'
import CalendarPage from './pages/CalendarPage'
import MarketIndex from './pages/MarketIndex'
import SettlementPredictor from './pages/SettlementPredictor'

function AppRoutes() {
  const { user, loading } = useAuth()
  useFirestoreSync()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <span style={{ fontSize: 32 }}>🎯</span>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="records" element={<Records />} />
        <Route path="monthly" element={<Monthly />} />
        <Route path="yearly" element={<Yearly />} />
        <Route path="guide" element={<Guide />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="market" element={<MarketIndex />} />
        <Route path="predictor" element={<SettlementPredictor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/txo-tracker/">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
