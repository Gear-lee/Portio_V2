import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowWelcome(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }
    setUserEmail(session.user.email)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-[#0b071e] text-white min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0b071e] text-white min-h-screen p-6 pb-24">
      <h1 className="text-3xl font-black mb-6">Dashboard</h1>

      <div
        className={`bg-black/40 border border-white/10 p-6 rounded-3xl transition-opacity duration-500 ${
          showWelcome ? 'opacity-100' : 'opacity-0 h-0 p-0 border-0 overflow-hidden'
        }`}
      >
        <p>Welcome back, {userEmail}!</p>
      </div>

      <Navbar />
    </div>
  )
}

export default Dashboard
