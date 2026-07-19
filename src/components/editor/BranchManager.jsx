import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

function BranchManager({ currentPageId, projectId, currentPageNumber, onChoicesChange }) {
  const navigate = useNavigate()
  const [choices, setChoices] = useState([])
  const [allPages, setAllPages] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentPageId || !projectId) return
    async function fetchData() {
      setLoading(true)
      const { data: choiceData } = await supabase.from('page_choices').select('*').eq('page_id', currentPageId).order('order_index', { ascending: true })
      const { data: pageData } = await supabase.from('pages').select('id, page_number').eq('project_id', projectId).order('page_number', { ascending: true })
      const { data: charData } = await supabase.from('characters').select('*, affinities(*)').eq('project_id', projectId).order('created_at', { ascending: true })

      setChoices(choiceData || [])
      setAllPages(pageData || [])
      setCharacters(charData || [])
      
      if (onChoicesChange) onChoicesChange(choiceData || [])
      setLoading(false)
    }
    fetchData()
  }, [currentPageId, projectId])

  const autoSaveChoice = useCallback(debounce(async (choiceId, updates) => {
    await supabase.from('page_choices').update(updates).eq('id', choiceId)
  }, 800), [])

  function handleFieldChange(choiceId, field, value) {
    const updated = choices.map(c => c.id === choiceId ? { ...c, [field]: value } : c)
    setChoices(updated)
    if (onChoicesChange) onChoicesChange(updated) // Push ke preview
    autoSaveChoice(choiceId, { [field]: value })
  }

  function handleCharacterChange(choiceId, charId) {
    const val = charId === '' ? null : charId
    const updated = choices.map(c => c.id === choiceId ? { ...c, affinity_character_id: val, affinity_id: null, affinity_value: 0 } : c)
    setChoices(updated)
    if (onChoicesChange) onChoicesChange(updated)
    autoSaveChoice(choiceId, { affinity_character_id: val, affinity_id: null, affinity_value: 0 })
  }

  async function handleCreateAndGo(choiceId) {
    const nextLinear = currentPageNumber + 1
    const exists = allPages.some(p => p.page_number === nextLinear)
    const maxPage = allPages.reduce((max, p) => Math.max(max, p.page_number), 0)
    
    const newPageNumber = exists ? (maxPage + 1) : nextLinear
    
    const { data: newPage, error } = await supabase.from('pages').insert({
      project_id: projectId,
      page_number: newPageNumber,
      dialog_text: ''
    }).select().single()

    if (!error && newPage) {
      await supabase.from('page_choices').update({ target_page_id: newPage.id }).eq('id', choiceId)
      navigate(`/project/${projectId}/editor?page=${newPageNumber}`)
    }
  }

  async function handleTargetChange(choiceId, value) {
    if (value === 'create_new') {
      handleCreateAndGo(choiceId)
      return
    }
    const targetValue = value === '' ? null : value
    const updated = choices.map(c => c.id === choiceId ? { ...c, target_page_id: targetValue } : c)
    setChoices(updated)
    if (onChoicesChange) onChoicesChange(updated)
    await supabase.from('page_choices').update({ target_page_id: targetValue }).eq('id', choiceId)
  }

  async function handleAddChoice() {
    const nextOrder = choices.length
    const { data } = await supabase.from('page_choices').insert({
      page_id: currentPageId,
      choice_text: 'New Choice...',
      order_index: nextOrder,
      affinity_value: 0
    }).select().single()
    if (data) {
      const updated = [...choices, data]
      setChoices(updated)
      if (onChoicesChange) onChoicesChange(updated)
    }
  }

  async function handleRemoveChoice(choiceId) {
    await supabase.from('page_choices').delete().eq('id', choiceId)
    const updated = choices.filter(c => c.id !== choiceId)
    setChoices(updated)
    if (onChoicesChange) onChoicesChange(updated)
  }

  if (loading) return <div className="text-slate-500 text-xs">Loading branches & stats...</div>

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-slate-400 text-sm font-bold">Story Branches</label>
      </div>
      <div className="space-y-4">
        {choices.map((choice) => {
          const selectedChar = characters.find(c => c.id === choice.affinity_character_id)
          const availableAffinities = selectedChar ? (selectedChar.affinities || []) : []
          const currentVal = choice.affinity_value ?? 0

          return (
            <div key={choice.id} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 mb-1 block">Button Text</label>
                  <input type="text" value={choice.choice_text} onChange={(e) => handleFieldChange(choice.id, 'choice_text', e.target.value)} className="w-full bg-slate-950 border border-white/10 p-2 rounded-lg text-xs text-white outline-none focus:border-pink-500" />
                </div>
                <div className="w-1/3">
                  <label className="text-[10px] text-slate-500 mb-1 block">Target Page</label>
                  <select value={choice.target_page_id || ''} onChange={(e) => handleTargetChange(choice.id, e.target.value)} className="w-full bg-slate-950 border border-white/10 p-2 rounded-lg text-xs text-white outline-none focus:border-pink-500">
                    <option value="">-- Disconnected --</option>
                    <option value="create_new" className="text-pink-400 font-bold">+ Create & Go</option>
                    {allPages.map((p) => (
                      <option key={p.id} value={p.id}>Page {p.page_number} {p.id === currentPageId ? '(Loop)' : ''}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => handleRemoveChoice(choice.id)} className="text-red-400 hover:text-red-500 text-xs font-bold pt-6 px-1">✕</button>
              </div>

              <div className="border-t border-white/5 pt-2 flex flex-wrap items-center gap-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-pink-500/80">⚡ Affinity:</span>
                <select value={choice.affinity_character_id || ''} onChange={(e) => handleCharacterChange(choice.id, e.target.value)} className="bg-slate-950 border border-white/10 p-1.5 rounded-lg text-[11px] text-slate-300 outline-none">
                  <option value="">-- Target Character --</option>
                  {characters.filter(c => c.role === 'sub').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {choice.affinity_character_id && (
                  <select value={choice.affinity_id || ''} onChange={(e) => handleFieldChange(choice.id, 'affinity_id', e.target.value === '' ? null : e.target.value)} className="bg-slate-950 border border-white/10 p-1.5 rounded-lg text-[11px] text-slate-300 outline-none">
                    <option value="">-- Select Affinity --</option>
                    {availableAffinities.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}

                {choice.affinity_id && (
                  <div className="flex items-center bg-slate-950 border border-white/10 rounded-lg p-0.5 overflow-hidden">
                    <button onClick={() => handleFieldChange(choice.id, 'affinity_value', currentVal - 1)} className="px-2.5 py-1 text-xs text-red-400 hover:bg-white/5 font-bold transition-colors">-</button>
                    <span className={`px-2 text-xs font-mono min-w-[24px] text-center font-bold ${currentVal > 0 ? 'text-green-400' : currentVal < 0 ? 'text-red-400' : 'text-slate-400'}`}>{currentVal > 0 ? `+${currentVal}` : currentVal}</span>
                    <button onClick={() => handleFieldChange(choice.id, 'affinity_value', currentVal + 1)} className="px-2.5 py-1 text-xs text-green-400 hover:bg-white/5 font-bold transition-colors">+</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <button onClick={handleAddChoice} className="w-full bg-slate-900 border border-dashed border-white/15 p-3 rounded-xl text-slate-400 text-xs hover:bg-slate-800 transition-all font-semibold">+ Add Choice Branch</button>
      </div>
    </div>
  )
}

function debounce(fn, delay) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}
export default BranchManager
