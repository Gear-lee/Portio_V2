import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

function Profile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const usernameParam = searchParams.get('username')

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [targetUser, setTargetUser] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)

  useEffect(() => {
    init()
  }, [usernameParam])

  async function init() {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }
    setCurrentUser(session.user)

    let profileData = null
    let ownProfile = false

    if (!usernameParam) {
      ownProfile = true
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      profileData = error || !data
        ? { id: session.user.id, username: 'new_user', bio: '', avatar_url: null }
        : data
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', usernameParam)
        .single()

      if (error || !data) {
        alert('User not found.')
        navigate('/dashboard')
        return
      }
      profileData = data
      ownProfile = data.id === session.user.id
    }

    setTargetUser(profileData)
    setIsOwnProfile(ownProfile)
    await loadStats(profileData.id)

    if (!ownProfile) {
      await checkFollowStatus(session.user.id, profileData.id)
    }

    setLoading(false)
  }

  async function loadStats(userId) {
    const { count: followingC } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    const { count: followersC } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    setFollowingCount(followingC || 0)
    setFollowersCount(followersC || 0)
  }

  async function checkFollowStatus(myId, targetId) {
    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', myId)
      .eq('following_id', targetId)
      .maybeSingle()

    setIsFollowing(!!data)
  }

  async function toggleFollow() {
    setFollowLoading(true)

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetUser.id)
      setIsFollowing(false)
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: currentUser.id, following_id: targetUser.id })
      setIsFollowing(true)
    }

    await loadStats(targetUser.id)
    setFollowLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/auth')
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
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-pink-500 overflow-hidden flex-shrink-0">
            <img
              src={targetUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold truncate">{targetUser.username || 'No Name'}</h2>
            <p className="text-pink-500 text-sm">@{targetUser.username || 'user'}</p>
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => navigate('/settings')}
              className="px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all disabled:opacity-50 ${
                isFollowing
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-orange-500 text-white hover:bg-orange-400'
              }`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        <p className="text-slate-400 text-sm mb-5">{targetUser.bio || 'No bio yet.'}</p>

        <div className="flex gap-8 border-t border-white/10 pt-4">
          <button onClick={() => navigate(`/following?username=${targetUser.username}`)} className="text-left">
            <span className="font-bold text-lg block">{followingCount}</span>
            <p className="text-xs text-slate-500">Following</p>
          </button>
          <button onClick={() => navigate(`/followers?username=${targetUser.username}`)} className="text-left">
            <span className="font-bold text-lg block">{followersCount}</span>
            <p className="text-xs text-slate-500">Followers</p>
          </button>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-3xl p-2">
        <div className="p-4 border-b border-white/5 flex justify-between items-center cursor-pointer">
          <span>Recent Play</span> <span className="text-slate-600">›</span>
        </div>
        <div
          className="p-4 border-b border-white/5 flex justify-between items-center cursor-pointer"
          onClick={() => navigate(`/following?username=${targetUser.username}`)}
        >
          <span>Following</span> <span className="text-slate-600">›</span>
        </div>
        <div
          className="p-4 border-b border-white/5 flex justify-between items-center cursor-pointer"
          onClick={() => navigate(`/followers?username=${targetUser.username}`)}
        >
          <span>Followers</span> <span className="text-slate-600">›</span>
        </div>

        {isOwnProfile && (
          <>
            <div
              className="p-4 border-b border-white/5 flex justify-between items-center cursor-pointer"
              onClick={() => navigate('/notifications')}
            >
              <span>Notifications</span> <span className="text-slate-600">›</span>
            </div>
            <div
              className="p-4 flex justify-between items-center cursor-pointer"
              onClick={() => navigate('/settings')}
            >
              <span>Profile Settings</span> <span className="text-slate-600">›</span>
            </div>
          </>
        )}
      </div>

      {isOwnProfile && (
        <button
          onClick={logout}
          className="w-full mt-6 py-4 border border-red-500/30 text-red-500 rounded-2xl font-bold"
        >
          SIGN OUT ACCOUNT
        </button>
      )}

      <Navbar />
    </div>
  )
}

export default Profile
