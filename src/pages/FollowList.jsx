import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

function FollowList({ mode }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const usernameParam = searchParams.get('username')

  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [profileOwner, setProfileOwner] = useState(null)

  useEffect(() => {
    init()
  }, [usernameParam, mode])

  async function init() {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }

    let ownerId = session.user.id

    if (usernameParam) {
      const { data: ownerData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', usernameParam)
        .single()

      if (error || !ownerData) {
        alert('User not found.')
        navigate('/dashboard')
        return
      }
      ownerId = ownerData.id
      setProfileOwner(ownerData)
    } else {
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfileOwner(ownerData)
    }

    const filterField = mode === 'following' ? 'follower_id' : 'following_id'
    const targetField = mode === 'following' ? 'following_id' : 'follower_id'

    const { data: relations, error: relError } = await supabase
      .from('followers')
      .select(targetField)
      .eq(filterField, ownerId)

    if (relError || !relations || relations.length === 0) {
      setList([])
      setLoading(false)
      return
    }

    const targetIds = relations.map((r) => r[targetField])

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', targetIds)

    setList(profiles || [])
    setLoading(false)
  }

  const title = mode === 'following' ? 'Following' : 'Followers'

  if (loading) {
    return (
      <div className="bg-[#0b071e] text-white min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-[#0b071e] text-white min-h-screen p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl">‹</button>
        <h1 className="text-2xl font-black">
          {title} {profileOwner?.username ? `· @${profileOwner.username}` : ''}
        </h1>
      </div>

      {list.length === 0 ? (
        <p className="text-slate-500 text-center mt-12">
          {mode === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((person) => (
            <div
              key={person.id}
              onClick={() => navigate(`/profile?username=${person.username}`)}
              className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-black/60 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                <img
                  src={person.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`}
                  className="w-full h-full object-cover"
                  alt="avatar"
                />
              </div>
              <div>
                <p className="font-bold">{person.username}</p>
                <p className="text-slate-500 text-sm">@{person.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Navbar />
    </div>
  )
}

export default FollowList
