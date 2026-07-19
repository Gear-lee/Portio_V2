import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import GamePreview from '../components/editor/GamePreview'
import SpritePicker from '../components/editor/SpritePicker'
import { ENTER_EXIT_EFFECTS } from '../data/effectOptions'
import { getPresetById } from '../data/presetCharacters'

function StoryEditor() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPageNumber = parseInt(searchParams.get('page') || '1', 10)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allPageNumbers, setAllPageNumbers] = useState([])
  const [currentPage, setCurrentPage] = useState(null)
  const [characters, setCharacters] = useState([])
  const [sprites, setSprites] = useState([]) // array of row dari page_sprites

  const [backgroundEmbed, setBackgroundEmbed] = useState('')
  const [backgroundEnterEffect, setBackgroundEnterEffect] = useState('none')
  const [backgroundExitEffect, setBackgroundExitEffect] = useState('none')

  const [dialogSelection, setDialogSelection] = useState('')
  const [dialogCustomName, setDialogCustomName] = useState('')
  const [dialogText, setDialogText] = useState('')

  useEffect(() => {
    init()
  }, [projectId, currentPageNumber])

  async function init() {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }

    const { data: charData } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    setCharacters(charData || [])
    await loadPage(charData || [])
  }

  async function loadPage(charList) {
    const { data: allPages } = await supabase
      .from('pages')
      .select('page_number')
      .eq('project_id', projectId)
      .order('page_number', { ascending: true })

    let pageNumbers = (allPages || []).map((p) => p.page_number)

    if (pageNumbers.length === 0) {
      const { data: newPage, error } = await supabase
        .from('pages')
        .insert({ project_id: projectId, page_number: 1 })
        .select()
        .single()

      if (error) {
        alert('Failed to create first page: ' + error.message)
        setLoading(false)
        return
      }

      pageNumbers = [1]
      await applyPageData(newPage, charList)
      setAllPageNumbers(pageNumbers)
      setLoading(false)
      return
    }

    setAllPageNumbers(pageNumbers)

    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', projectId)
      .eq('page_number', currentPageNumber)
      .maybeSingle()

    if (pageError || !pageData) {
      setSearchParams({ page: pageNumbers[0] })
      return
    }

    await applyPageData(pageData, charList)
    setLoading(false)
  }

  async function applyPageData(pageData, charList) {
    setCurrentPage(pageData)
    setBackgroundEmbed(pageData.background_embed || '')
    setBackgroundEnterEffect(pageData.background_enter_effect || 'none')
    setBackgroundExitEffect(pageData.background_exit_effect || 'none')
    setDialogText(pageData.dialog_text || '')

    const savedName = pageData.dialog_character_name || ''
    const matchedChar = charList.find((c) => c.name === savedName)

    if (!savedName) {
      setDialogSelection('')
      setDialogCustomName('')
    } else if (matchedChar) {
      setDialogSelection(matchedChar.id)
      setDialogCustomName('')
    } else {
      setDialogSelection('custom')
      setDialogCustomName(savedName)
    }

    // Load sprites untuk page ini
    const { data: spriteData } = await supabase
      .from('page_sprites')
      .select('*')
      .eq('page_id', pageData.id)
      .order('order_index', { ascending: true })

    setSprites(spriteData || [])
  }

  const autoSave = useCallback(
    debounce(async (pageId, updates) => {
      setSaving(true)
      await supabase.from('pages').update(updates).eq('id', pageId)
      setSaving(false)
    }, 800),
    []
  )

  const autoSaveSprite = useCallback(
    debounce(async (spriteId, updates) => {
      setSaving(true)
      await supabase.from('page_sprites').update(updates).eq('id', spriteId)
      setSaving(false)
    }, 800),
    []
  )

  function handleFieldChange(field, value, setter) {
    setter(value)
    if (currentPage) {
      autoSave(currentPage.id, { [field]: value, updated_at: new Date().toISOString() })
    }
  }

  function handleDialogSelectionChange(value) {
    setDialogSelection(value)

    let nameToSave = ''
    if (value === 'custom') {
      nameToSave = dialogCustomName
    } else if (value === '') {
      nameToSave = ''
    } else {
      const char = characters.find((c) => c.id === value)
      nameToSave = char ? char.name : ''
    }

    if (currentPage) {
      autoSave(currentPage.id, { dialog_character_name: nameToSave, updated_at: new Date().toISOString() })
    }
  }

  function handleCustomNameChange(value) {
    setDialogCustomName(value)
    if (currentPage) {
      autoSave(currentPage.id, { dialog_character_name: value, updated_at: new Date().toISOString() })
    }
  }

  async function handleAddSprite() {
    const { data, error } = await supabase
      .from('page_sprites')
      .insert({
        page_id: currentPage.id,
        position: 'center',
        order_index: sprites.length,
      })
      .select()
      .single()

    if (error) {
      alert('Failed to add sprite: ' + error.message)
      return
    }

    setSprites([...sprites, data])
  }

  function handleSpriteFieldChange(spriteId, field, value) {
    setSprites(sprites.map((s) => (s.id === spriteId ? { ...s, [field]: value } : s)))
    autoSaveSprite(spriteId, { [field]: value })
  }

  async function handleRemoveSprite(spriteId) {
    await supabase.from('page_sprites').delete().eq('id', spriteId)
    setSprites(sprites.filter((s) => s.id !== spriteId))
  }

  function goToPage(pageNum) {
    setSearchParams({ page: pageNum })
  }

  const previewDialogName = dialogSelection === 'custom'
    ? dialogCustomName
    : (characters.find((c) => c.id === dialogSelection)?.name || '')

  // Siapin data sprite buat preview (hitung URL gambar masing-masing)
  const previewSprites = sprites.map((sprite) => {
    let url = ''
    if (sprite.sprite_mode === 'preset' && sprite.sprite_character_id) {
      const char = characters.find((c) => c.id === sprite.sprite_character_id)
      const preset = char ? getPresetById(char.preset_id) : null
      if (preset) url = preset.expressions[sprite.sprite_expression || 'neutral']
    } else if (sprite.sprite_mode === 'embed') {
      url = sprite.sprite_embed
    }
    return { url, position: sprite.position }
  })

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/project/${projectId}`)} className="text-2xl">‹</button>
            <h1 className="text-xl font-black">Page {currentPageNumber}</h1>
          </div>
          <span className="text-xs text-slate-500">{saving ? 'Saving...' : 'Saved'}</span>
        </div>

        <GamePreview
          backgroundEmbed={backgroundEmbed}
          sprites={previewSprites}
          dialogName={previewDialogName}
          dialogText={dialogText}
        />

        <div className="space-y-4 mt-6">
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Background (embed link)</label>
            <input
              type="text"
              placeholder="https://..."
              value={backgroundEmbed}
              onChange={(e) => handleFieldChange('background_embed', e.target.value, setBackgroundEmbed)}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Background Enter Effect</label>
              <select
                value={backgroundEnterEffect}
                onChange={(e) => handleFieldChange('background_enter_effect', e.target.value, setBackgroundEnterEffect)}
                className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm focus:border-pink-500 outline-none"
              >
                {ENTER_EXIT_EFFECTS.map((eff) => (
                  <option key={eff.id} value={eff.id}>{eff.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-xs mb-1 block">Background Exit Effect</label>
              <select
                value={backgroundExitEffect}
                onChange={(e) => handleFieldChange('background_exit_effect', e.target.value, setBackgroundExitEffect)}
                className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm focus:border-pink-500 outline-none"
              >
                {ENTER_EXIT_EFFECTS.map((eff) => (
                  <option key={eff.id} value={eff.id}>{eff.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprite list */}
          <div className="space-y-3">
            {sprites.map((sprite) => (
              <SpritePicker
                key={sprite.id}
                characters={characters}
                sprite={sprite}
                onChange={(field, value) => handleSpriteFieldChange(sprite.id, field, value)}
                onRemove={() => handleRemoveSprite(sprite.id)}
                canRemove={true}
              />
            ))}

            <button
              onClick={handleAddSprite}
              className="w-full bg-black/40 border border-dashed border-white/20 rounded-2xl p-3 text-slate-400 text-sm hover:bg-black/60 transition-all"
            >
              + Add Sprite
            </button>
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Character Name</label>
            <select
              value={dialogSelection}
              onChange={(e) => handleDialogSelectionChange(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
            >
              <option value="">-- None --</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.role === 'mc' ? '(MC)' : ''}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>

            {dialogSelection === 'custom' && (
              <input
                type="text"
                placeholder="Type a custom name (leave empty for narrator)"
                value={dialogCustomName}
                onChange={(e) => handleCustomNameChange(e.target.value)}
                className="w-full mt-2 bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none"
              />
            )}
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Dialogue</label>
            <textarea
              value={dialogText}
              onChange={(e) => handleFieldChange('dialog_text', e.target.value, setDialogText)}
              rows={3}
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:border-pink-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-8">
          {allPageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => goToPage(num)}
              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                num === currentPageNumber
                  ? 'bg-pink-600 text-white'
                  : 'bg-black/40 border border-white/10 text-slate-400'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export default StoryEditor
