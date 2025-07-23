import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'

import './App.css'
import HomePage from './pages/HomePage.tsx'
import Auth from './components/Auth.tsx'
import AdminPage from './pages/AdminPage.tsx'

function App() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (!session) return <Auth />

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
        <h3>Welcome!</h3>
        <button onClick={logout}>Log out</button>
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
