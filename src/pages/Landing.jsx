import { useNavigate } from 'react-router-dom'

function Landing() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/images/workspace-bg.png')" }}
    >
      {/* Navbar atas */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <span className="text-white text-2xl font-black">PLOTIO</span>
          <span className="text-xs font-bold text-cyan-300 border border-cyan-300/50 rounded-full px-2 py-1">
            VN MAKER
          </span>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-5 py-3 rounded-full transition-all"
        >
          Sign In / Register
        </button>
      </div>

      {/* Hero card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-black/70 backdrop-blur-md rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-4xl font-black text-white leading-tight">
            Build Your Own<br />Visual Novel
          </h1>

          <h2 className="text-2xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
            Without A Single Line Of Code.
          </h2>

          <p className="text-slate-300 text-sm">
            Bring your stories to life. Design characters, map complex branching choices, and publish your interactive masterpieces directly from your browser.
          </p>

          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold py-4 rounded-2xl transition-all"
          >
            Start Creating For Free →
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing
