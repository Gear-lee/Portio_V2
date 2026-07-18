import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import { supabase } from '../lib/supabaseClient'
import { getCroppedImg } from '../lib/cropImage'
import Navbar from '../components/Navbar'
import Header from '../components/Header'

function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState(null)

  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)

  const [imageToCrop, setImageToCrop] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [showCropModal, setShowCropModal] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }
    setUserId(session.user.id)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setDisplayName(data.display_name || '')
      setHandle(data.handle || '')
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || null)
    }

    setLoading(false)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue)
  }, [])

  async function handleConfirmCrop() {
    setSaving(true)
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)

      const fileName = `${userId}-${Date.now()}.jpg`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        alert('Upload failed: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrlData.publicUrl)
      setShowCropModal(false)
      setImageToCrop(null)
    } catch (err) {
      alert('Something went wrong while cropping: ' + err.message)
    }
    setSaving(false)
  }

  async function handleSave() {
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      alert('Failed to save: ' + error.message)
    } else {
      navigate('/profile')
    }
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
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-2xl">‹</button>
          <h1 className="text-2xl font-black">Profile Settings</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-28 h-28 rounded-full bg-slate-800 border-2 border-pink-500 overflow-hidden mb-3">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          </div>
          <label className="text-pink-500 font-bold text-sm cursor-pointer hover:underline">
            Change Profile Photo
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">
              Handle <span className="text-slate-600">(cannot be changed)</span>
            </label>
            <div className="flex items-center w-full bg-slate-900/50 border border-white/5 rounded-xl">
              <span className="pl-4 text-slate-600 font-bold select-none">@</span>
              <input
                type="text"
                value={handle}
                disabled
                className="w-full bg-transparent p-4 pl-1 text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-pink-600 hover:bg-pink-500 py-4 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {showCropModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="p-6 bg-[#0b071e] space-y-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setImageToCrop(null)
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCrop}
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold bg-pink-600 disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Use Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  )
}

export default Settings
