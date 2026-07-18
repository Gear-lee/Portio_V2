import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function Notifications() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          loadNotifications(userId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }
    setUserId(session.user.id)
    await loadNotifications(session.user.id)
    await markAllAsRead(session.user.id)
    setLoading(false)
  }

  async function loadNotifications(uid) {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !notifs || notifs.length === 0) {
      setNotifications([])
      return
    }

    const actorIds = [...new Set(notifs.map((n) => n.actor_id))]
    const { data: actors } = await supabase
      .from('profiles')
      .select('*')
      .in('id', actorIds)

    const actorMap = {}
    ;(actors || []).forEach((a) => { actorMap[a.id] = a })

    const enriched = notifs.map((n) => ({
      ...n,
      actor: actorMap[n.actor_id] || { username: 'someone' },
    }))

    setNotifications(enriched)
  }

  async function markAllAsRead(uid) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', uid)
      .eq('is_read', false)
  }

  function handleNotifClick(notif) {
    if (notif.type === 'follow') {
      navigate(`/profile?username=${notif.actor.username}`)
    }
    // nanti nambah: else if (notif.type === 'game_update') { navigate(`/game/${notif.game_id}`) }
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl">‹</button>
        <h1 className="text-2xl font-black">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <p className="text-slate-500 text-center mt-12">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                notif.is_read
                  ? 'bg-black/40 border-white/10 hover:bg-black/60'
                  : 'bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                <img
                  src={notif.actor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor.username}`}
                  className="w-full h-full object-cover"
                  alt="avatar"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold">{notif.actor.username}</span> started following you
                </p>
                <p className="text-slate-500 text-xs mt-1">{timeAgo(notif.created_at)}</p>
              </div>
              {!notif.is_read && <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0"></div>}
            </div>
          ))}
        </div>
      )}

      <Navbar />
    </div>
  )
}

export default Notifications
