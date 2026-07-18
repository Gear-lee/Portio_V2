import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

function Create() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  async function handleCreateProject() {
    setCreating(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ owner_id: session.user.id, title: 'Untitled Project' })
      .select()
      .single()

    setCreating(false)

    if (error) {
      alert('Failed to create project: ' + error.message)
      return
    }

    navigate(`/project/${data.id}`)
  }

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
        <button
          onClick={handleCreateProject}
          disabled={creating}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold text-lg px-10 py-6 rounded-3xl transition-all disabled:opacity-50 shadow-2xl shadow-pink-500/20"
        >
          {creating ? 'Creating...' : '+ Create New Project'}
        </button>
      </div>
    </Layout>
  )
}

export default Create
