import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import Header from '../components/Header'

function Projects() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }
    await loadProjects(session.user.id)
    setLoading(false)
  }

  async function loadProjects(uid) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', uid)
      .order('updated_at', { ascending: false })

    setProjects(data || [])
  }

  if (loading) {
    return (
      <div className="bg-[#0b071e] text-white min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0b071e] text-white min-h-screen pb-24">
      <Header />
      <div className="px-6">
        <h1 className="text-3xl font-black mb-6">Your Projects</h1>

        {projects.length === 0 ? (
          <div className="bg-black/40 border border-white/10 rounded-3xl p-8 text-center">
            <p className="text-slate-400 mb-2">You haven't created any project yet.</p>
            <p className="text-slate-500 text-sm">Tap "Create" below to start building your visual novel.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-black/40 border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-black/60 transition-all"
              >
                <h2 className="font-bold text-lg">{project.title}</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Last updated: {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  )
}

export default Projects
