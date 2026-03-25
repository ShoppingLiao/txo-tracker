import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-icon">🎯</span>
          <h1 className="login-title">TXO Tracker</h1>
          <p className="login-subtitle">台指選擇權操作紀錄</p>
        </div>

        <button className="btn-google" onClick={signInWithGoogle}>
          <svg className="google-logo" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.4l7.8 6C12.4 13.2 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.5-4.1 7.1-10.2 7.1-17.1z"/>
            <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.6 2.2-7.6 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
          </svg>
          使用 Google 帳號登入
        </button>

        <p className="login-note">登入後資料將儲存在雲端，可跨裝置使用</p>
      </div>
    </div>
  )
}
