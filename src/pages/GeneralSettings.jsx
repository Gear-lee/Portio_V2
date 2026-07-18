import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import { FONT_OPTIONS, getFontById } from '../data/fontOptions'

function LivePreview({ title, titleCoverType, titleCoverContent, coverEmbed, devNameType, devName, devNameEmbed, fontChoice }) {
  const font = getFontById(fontChoice)

  return (
    <div
      className="relative w-full aspect-[9/16] max-h-[420px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 mx-auto"
      style={{ fontFamily: font.family }}
    >
      {coverEmbed ? (
        <img src={coverEmbed} className="absolute inset-0 w-full h-full object-contain bg-black" alt="cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
      )}

      <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4 pointer-events-none">
        {/* Judul di tengah-atas */}
        <div className="flex justify-center pt-6">
          {titleCoverType === 'embed' && titleCoverContent ? (
            <img src={titleCoverContent} className="max-h-16 object-contain" alt="title" />
          ) : (
            <h1 className="text-white text-2xl font-black text-center drop-shadow-lg">
              {titleCoverContent || title || 'Untitled'}
            </h1>
          )}
        </div>

        {/* Tombol menu */}
        <div className="flex flex-col gap-2 items-center pb-2">
          <button className="w-32 py-2 bg-pink-600/90 rounded-full text-white text-xs font-bold">Start</button>
          <button className="w-32 py-2 bg-white/10 rounded-full text-white text-xs font-bold">Load</button>
          <button className="w-32 py-2 bg-white/10 rounded-full text-white text-xs font-bold">About</button>
        </div>

        {/* Dev name kanan-bawah */}
        <div className="absolute bottom-2 right-3">
          {devNameType === 'embed' && devNameEmbed ? (
            <img src={devNameEmbed} className="max-h-6 object-contain" alt="dev" />
          ) : (
            <p className="text-white/70 text-[10px]">{devName || ''}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function GeneralSettings() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [coverEmbed, setCoverEmbed] = useState('')
  const [titleCoverType, setTitleCoverType] = useState('text')
  const [titleCoverContent, setTitleCoverContent] = useState('')
  const [devNameType, setDevNameType] = useState('text')
  const [devName, setDevName] = useState('')
  const [devNameEmbed, setDevNameEmbed] = useState('')
  const [aboutGame, setAboutGame] = useState('')
  const [fontChoice, setFontChoice] = useState('default')
  const [walkthroughEnabled, setWalkthroughEnabled] = useState(false)

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

    setTitle(data.title || '')
    setCoverEmbed(data.title_screen_embed || '')
    setTitleCoverType(data.title_cover_type || 'text')
    setTitleCoverContent(data.title_cover_content || '')
    setDevNameType(data.developer_name_type || 'text')
    setDevName(data.developer_name || '')
    setDevNameEmbed(data.developer_name_embed || '')
    setAboutGame(data.about_game || '')
    setFontChoice(data.font_choice || 'default')
    setWalkthroughEnabled(data.walkthrough_hints_enabled || false)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)

    const { error } = await supabase
      .from('projects')
      .update({
        title,
        title_screen_embed: coverEmbed,
        title_cover_type: titleCoverType,
        title_cover_content: titleCoverContent,
        developer_name_type: devNameType,
        developer_name: devName,
        developer_name_embed: devNameEmbed,
        about_game: aboutGame,
        font_choice: fontChoice,
        walkthrough_hints_enabled: walkthroughEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    setSaving(false)

    if (error) {
      alert('Failed to save: ' + error.message)
    } else {
      navigate(`/project/${projectId}`)
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
      <div className="px-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(`/project/${projectId}`)} className="text-2xl">‹</button>
          <h1 className="text-2xl font-black">General Settings</h1>
        </div>

        {/* Live Preview */}
        <div>
          <label className="text-slate-400 text-sm mb-2 block">Live Preview</label>
          <LivePreview
            title={title}
            titleCoverType={titleCoverType}
            titleCoverContent={titleCoverContent}
            coverEmbed={coverEmbed}
            devNameType={devNameType}
            devName={devName}
            devNameEmbed={devNameEmbed}
            fontChoice={fontChoice}
          />
        </div>

        {/* Game Title (internal) */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">
            Game Title <span className="text-slate-600">(internal project name)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
          />
        </div>

        {/* Game Cover */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Game Cover (embed link)</label>
          <input
            type="text"
            placeholder="https://..."
            value={coverEmbed}
            onChange={(e) => setCoverEmbed(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
          />
        </div>

        {/* Game Title Cover */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">
            Game Title Cover <span className="text-slate-600">(shown on cover screen)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setTitleCoverType('text')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                titleCoverType === 'text' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setTitleCoverType('embed')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                titleCoverType === 'embed' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Embed Image
            </button>
          </div>
          <input
            type="text"
            placeholder={titleCoverType === 'text' ? 'Game title shown on cover' : 'https://...'}
            value={titleCoverContent}
            onChange={(e) => setTitleCoverContent(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
          />
        </div>

        {/* Developer Name */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Developer Name</label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setDevNameType('text')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                devNameType === 'text' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setDevNameType('embed')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                devNameType === 'embed' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Embed Image
            </button>
          </div>
          {devNameType === 'text' ? (
            <input
              type="text"
              placeholder="Your studio/name"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
            />
          ) : (
            <input
              type="text"
              placeholder="https://..."
              value={devNameEmbed}
              onChange={(e) => setDevNameEmbed(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
            />
          )}
        </div>

        {/* About Game */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">
            About Game <span className="text-slate-600">(shown in-game on About screen)</span>
          </label>
          <textarea
            value={aboutGame}
            onChange={(e) => setAboutGame(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none resize-none"
          />
        </div>

        {/* Typography */}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Font (used for UI and dialogue)</label>
          <select
            value={fontChoice}
            onChange={(e) => setFontChoice(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Walkthrough Hints */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold">Walkthrough Hints</p>
            <p className="text-slate-500 text-xs">Show affinity effect hints to players</p>
          </div>
          <button
            onClick={() => setWalkthroughEnabled(!walkthroughEnabled)}
            className={`w-12 h-7 rounded-full transition-all relative ${
              walkthroughEnabled ? 'bg-pink-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${
                walkthroughEnabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
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
  )
}

export default GeneralSettings
