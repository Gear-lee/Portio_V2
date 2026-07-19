import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import GamePreview from '../components/editor/GamePreview'
import SpritePicker from '../components/editor/SpritePicker'
import BranchManager from '../components/editor/BranchManager'
import { getPresetById } from '../data/presetCharacters'

function StoryEditor() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const pageParam = searchParams.get('page')
  const currentPageNumber = parseInt(pageParam || '1', 10)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(null)
  const [characters, setCharacters] = useState([])
  const [sprites, setSprites] = useState([])
  const [choices, setChoices] = useState([]) // State baru untuk preview choices
  const [backgroundEmbed, setBackgroundEmbed] = useState('')
  const [dialogSelection, setDialogSelection] = useState('')
  const [dialogCustomName, setDialogCustomName] = useState('')
  const [dialogText, setDialogText] = useState('')

  useEffect(() => { init() }, [projectId, pageParam])

  async function init() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/auth'); return }

    if (!pageParam) {
      navigate(`/project/${projectId}/editor?page=1`, { replace: true })
      return
    }

    const { data: charData } = await supabase.from('characters').select('*').eq('project_id', projectId)
    setCharacters(charData || [])
    await loadPage(charData || [])
  }

  async function loadPage(charList) {
    const { data: pageData } = await supabase.from('pages').select('*').eq('project_id', projectId).eq('page_number', currentPageNumber).maybeSingle()
    if (pageData) {
      setCurrentPage(pageData)
      setBackgroundEmbed(pageData.background_embed || '')
      setDialogText(pageData.dialog_text || '')
      const savedName = pageData.dialog_character_name || ''
      const matchedChar = charList.find((c) => c.name === savedName)
      if (!savedName) { setDialogSelection(''); setDialogCustomName('') }
      else if (matchedChar) { setDialogSelection(matchedChar.id); setDialogCustomName('') }
      else { setDialogSelection('custom'); setDialogCustomName(savedName) }
      
      // 1. Ambil data sprites
      const { data: spriteData } = await supabase.from('page_sprites').select('*').eq('page_id', pageData.id).order('order_index', { ascending: true })
      setSprites(spriteData || [])

      // 2. Ambil data choices untuk dilempar ke GamePreview
      const { data: choiceData } = await supabase.from('page_choices').select('*').eq('page_id', pageData.id).order('order_index', { ascending: true })
      setChoices(choiceData || [])
    } else {
      setCurrentPage(null)
      setChoices([])
    }
    setLoading(false)
  }

  const autoSave = useCallback(debounce(async (pageId, updates) => {
    setSaving(true); await supabase.from('pages').update(updates).eq('id', pageId); setSaving(false)
  }, 800), [])

  const autoSaveSprite = useCallback(debounce(async (spriteId, updates) => {
    setSaving(true); await supabase.from('page_sprites').update(updates).eq('id', spriteId); setSaving(false)
  }, 800), [])

  function handleFieldChange(field, value, setter) {
    setter(value); if (currentPage) autoSave(currentPage.id, { [field]: value, updated_at: new Date().toISOString() })
  }

  function handleDialogSelectionChange(value) {
    setDialogSelection(value)
    let nameToSave = value === 'custom' ? dialogCustomName : (value ? characters.find((c) => c.id === value)?.name : '')
    if (currentPage) autoSave(currentPage.id, { dialog_character_name: nameToSave, updated_at: new Date().toISOString() })
  }

  async function handleAddSprite() {
    if (!currentPage) return
    const { data } = await supabase.from('page_sprites').insert({ 
      page_id: currentPage.id, 
      position: '50', 
      sprite_mode: 'preset',
      sprite_zoom: 100, 
      sprite_y_offset: 0 
    }).select().single()
    if (data) setSprites([...sprites, data])
  }

  function handleSpriteFieldChange(spriteId, field, value) {
    setSprites(sprites.map((s) => (s.id === spriteId ? { ...s, [field]: value } : s)))
    autoSaveSprite(spriteId, { [field]: value })
  }

  async function handleRemoveSprite(spriteId) {
    await supabase.from('page_sprites').delete().eq('id', spriteId)
    setSprites(sprites.filter(x => x.id !== spriteId))
  }

  async function handleInitializePage() {
    setLoading(true)
    const { data, error } = await supabase.from('pages').insert({
      project_id: projectId,
      page_number: currentPageNumber,
      dialog_text: ''
    }).select().single()
    if (!error && data) {
      await init()
    }
    setLoading(false)
  }

  // Fungsi callback agar saat BranchManager merubah choice, preview ter-update real-time
  const handleChoicesRefresh = (updatedChoices) => {
    setChoices(updatedChoices)
  }

  const previewSprites = sprites.map((s) => {
    let url = ''
    if (s.sprite_mode === 'preset' && s.sprite_character_id) {
      const char = characters.find((c) => c.id === s.sprite_character_id)
      const preset = char ? getPresetById(char.preset_id) : null
      if (preset) url = preset.expressions[s.sprite_expression || 'neutral']
    } else if (s.sprite_mode === 'embed') {
      url = s.sprite_embed
    }
    return { url, position: s.position, sprite_zoom: s.sprite_zoom, sprite_y_offset: s.sprite_y_offset }
  })

  if (loading) return <div className="text-white min-h-screen flex items-center justify-center bg-[#0b071e]">Loading...</div>

  return (
    <div className="bg-[#0b071e] text-white h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Oper data choices ke GamePreview */}
      <div className="flex-shrink-0 px-6 pb-4 border-b border-white/5 bg-[#0b071e] z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/project/${projectId}`)} className="flex items-center justify-center bg-slate-900 border border-white/10 hover:bg-slate-800 p-2 rounded-xl text-xs transition-all text-slate-300 font-bold">← Back</button>
            <h1 className="text-lg font-black text-pink-500">Page {currentPageNumber}</h1>
          </div>
          <span className="text-xs text-slate-500">{saving ? 'Saving...' : 'Saved'}</span>
        </div>
        <GamePreview 
          backgroundEmbed={backgroundEmbed} 
          sprites={previewSprites} 
          dialogName={dialogSelection === 'custom' ? dialogCustomName : characters.find(c => c.id === dialogSelection)?.name} 
          dialogText={dialogText} 
          choices={choices} // <-- PASS CHOICES DI SINI
        />
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-thin">
        {!currentPage ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-black/20 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-400">This page hasn't been initialized yet</h3>
            <p className="text-xs text-slate-500 max-w-xs">Click button below to create row data for Page {currentPageNumber} and start writing.</p>
            <button onClick={handleInitializePage} className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-lg shadow-pink-600/20">✨ Initialize Page {currentPageNumber}</button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2 block">Background</label>
              <input type="text" placeholder="Background image link..." value={backgroundEmbed} onChange={(e) => handleFieldChange('background_embed', e.target.value, setBackgroundEmbed)} className="w-full bg-slate-900 p-4 rounded-xl border border-white/10 outline-none" />
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2 block">Sprites</label>
              <div className="space-y-3">
                {sprites.map((s) => (
                  <SpritePicker key={s.id} characters={characters} sprite={s} onChange={(f, v) => handleSpriteFieldChange(s.id, f, v)} onRemove={() => handleRemoveSprite(s.id)} canRemove={true} />
                ))}
                <button onClick={handleAddSprite} className="w-full bg-slate-900 border border-dashed border-white/20 p-4 rounded-2xl text-slate-400 text-sm hover:bg-slate-800 transition-all">+ Add Sprite</button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2 block">Character Name</label>
              <select value={dialogSelection} onChange={(e) => handleDialogSelectionChange(e.target.value)} className="w-full bg-slate-900 p-4 rounded-xl border border-white/10 outline-none">
                <option value="">-- None --</option>
                {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="custom">Custom...</option>
              </select>
              {dialogSelection === 'custom' && (
                <input type="text" placeholder="Custom name..." value={dialogCustomName} onChange={(e) => {setDialogCustomName(e.target.value); if(currentPage) autoSave(currentPage.id, { dialog_character_name: e.target.value })}} className="w-full mt-2 bg-slate-900 p-4 rounded-xl border border-white/10 outline-none" />
              )}
            </div>

            <div>
              <label className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2 block">Dialogue</label>
              <textarea value={dialogText} onChange={(e) => handleFieldChange('dialog_text', e.target.value, setDialogText)} rows={3} className="w-full bg-slate-900 p-4 rounded-xl border border-white/10 outline-none resize-none" />
            </div>

            <div className="pb-8">
              <BranchManager 
                currentPageId={currentPage.id} 
                projectId={projectId} 
                currentPageNumber={currentPageNumber} 
                onChoicesChange={handleChoicesRefresh} // <-- BIND REFRESH DI SINI
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function debounce(fn, delay) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}
export default StoryEditor
