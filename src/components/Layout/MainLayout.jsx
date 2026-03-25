import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import './MainLayout.css'

export default function MainLayout() {
  return (
    <div className="layout">
      <TopBar />
      <div className="layout-body">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
