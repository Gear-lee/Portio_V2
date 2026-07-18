import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

function ProjectDashboard() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    init()
  }, [projectId])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      alert('Project not found.')
      navigate('/projects')
      return
    }

    setProject(data)

    const { count } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    setPageCount(count || 0)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <Layout>
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/projects')} className="text-2xl">‹</button>
          <h1 className="text-2xl font-black truncate">{project.title}</h1>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 mb-4">
          <p className="text-slate-400 text-sm">Pages created</p>
          <p className="text-3xl font-black">{pageCount}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(`/project/${projectId}/editor`)}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold py-4 rounded-2xl transition-all text-left px-6"
          >
            📝 Story Editor
          </button>

          <button
            onClick={() => navigate(`/project/${projectId}/characters`)}
            className="w-full bg-black/40 border border-white/10 hover:bg-black/60 text-white font-bold py-4 rounded-2xl transition-all text-left px-6"
          >
            👤 Character Settings
          </button>

          <button
            onClick={() => navigate(`/project/${projectId}/general-settings`)}
            className="w-full bg-black/40 border border-white/10 hover:bg-black/60 text-white font-bold py-4 rounded-2xl transition-all text-left px-6"
          >
            ⚙️ General Settings
          </button>

          <button
            onClick={() => navigate(`/project/${projectId}/map`)}
            className="w-full bg-black/40 border border-white/10 hover:bg-black/60 text-white font-bold py-4 rounded-2xl transition-all text-left px-6"
          >
            🗺️ Visual Map
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default ProjectDashboard
