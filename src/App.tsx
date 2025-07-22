import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient.js'
import './App.css'
import HomePage from './components/HomePage.tsx'
import Auth from './components/Auth.tsx'
import Leaderboard from './components/Leaderboard.tsx' 
import AdminPanel from './components/Admin.tsx'
import Timer from './components/Timer.tsx'

function App() {  

  const [session, setSession] = useState<any>(null)

  const fetchSession = async () => {
     const currentSession = await supabase.auth.getSession();
     console.log("Current session:", currentSession);
     setSession(currentSession.data.session);
  };

  useEffect(() => {
    fetchSession()

    const { data: auth_listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      auth_listener.subscription.unsubscribe();
    }
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  }

return (
    <>
 
        {session ? (
        <>
          <button onClick={logout}>log out</button>
          <HomePage />
          <Leaderboard />
          <AdminPanel />
          <Timer />
        </>
        ) : (
        <Auth />
        ) }

    </>
  )
}

export default App
