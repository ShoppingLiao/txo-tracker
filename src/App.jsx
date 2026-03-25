import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import Monthly from './pages/Monthly'
import Yearly from './pages/Yearly'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="records" element={<Records />} />
          <Route path="monthly" element={<Monthly />} />
          <Route path="yearly" element={<Yearly />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
