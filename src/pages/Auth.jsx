import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const HANDLE_REGEX = /^[a-zA-Z0-9_]+$/

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [handleStatus, setHandleStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid'

  const navigate = useNavigate()

  // Real-time handle check dengan debounce
  useEffect(() => {
    if (isLogin || !handle) {
      setHandleStatus(null)
      return
    }

    if (!HANDLE_REGEX.test(handle)) {
      setHandleStatus('invalid')
      return
    }

    setHandleStatus('checking')

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', handle)
        .maybeSingle()

      setHandleStatus(data ? 'taken' : 'available')
    }, 500)

    return () => clearTimeout(timer)
  }, [handle, isLogin])

  function handleHandleChange(e) {
    // Buang karakter yang bukan huruf/angka/underscore, dan buang spasi
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
    setHandle(cleaned)
  }

  async function handleAuth() {
    if (!email || !password) {
      alert('Email and password are required.')
      return
    }

    if (!isLogin) {
      if (!name || !handle) {
        alert('Name and handle are required.')
        return
      }
      if (handleStatus === 'taken') {
        alert('This handle is already taken.')
        return
      }
      if (handleStatus === 'invalid') {
        alert('Handle can only contain letters, numbers, and underscores.')
        return
      }
      if (handleStatus !== 'available') {
        alert('Please wait, still checking handle availability...')
        return
      }
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            handle: handle,
          },
        },
      })

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
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-5">
        <h2 className="text-3xl font-black text-center">
          {isLogin ? 'Sign In' : 'Register'}
        </h2>

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
            />

            <div className="relative">
              <div className="flex items-center w-full bg-slate-900 border border-white/10 rounded-xl focus-within:border-pink-500">
                <span className="pl-4 text-slate-500 font-bold select-none">@</span>
                <input
                  type="text"
                  placeholder="handle"
                  value={handle}
                  onChange={handleHandleChange}
                  className="w-full bg-transparent p-4 pl-1 outline-none"
                />
              </div>
              {handleStatus && (
                <p
                  className={`text-xs mt-1 pl-1 ${
                    handleStatus === 'available'
                      ? 'text-green-400'
                      : handleStatus === 'checking'
                      ? 'text-slate-500'
                      : 'text-red-400'
                  }`}
                >
                  {handleStatus === 'checking' && 'Checking availability...'}
                  {handleStatus === 'available' && '✓ Handle is available'}
                  {handleStatus === 'taken' && '✗ Handle is already taken'}
                  {handleStatus === 'invalid' && '✗ Only letters, numbers, and underscores allowed'}
                </p>
              )}
            </div>
          </>
        )}

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
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
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
