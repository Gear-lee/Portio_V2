import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleAuth() {
    if (!email || !password) {
      alert('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        alert('Login Failed: ' + error.message)
        setLoading(false)
      } else {
        navigate('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        alert('Registration Failed: ' + error.message)
        setLoading(false)
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) {
          alert('Auto-login failed: ' + loginError.message)
          setLoading(false)
        } else {
          navigate('/dashboard')
        }
      }
    }
  }

  return (
    <div className="bg-[#0b071e] text-white flex items-center justify-center min-h-screen p-6">
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6">
        <h2 className="text-3xl font-black text-center">
          {isLogin ? 'Sign In' : 'Register'}
        </h2>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-500 py-4 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Memproses...' : (isLogin ? 'Sign In' : 'Register')}
        </button>

        <p className="text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-pink-500 font-bold hover:underline ml-1"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth
