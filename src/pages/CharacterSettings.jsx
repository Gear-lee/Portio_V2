import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import { ALL_PRESETS, getPresetById } from '../data/presetCharacters'

function CharacterCard({ character, isMc, onUpdateName, onUpdatePreset, onAddAffinity, onDeleteAffinity, canDelete, onDeleteCharacter }) {
  const [newAffinityName, setNewAffinityName] = useState('')
  const preset = getPresetById(character.preset_id)

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        {preset && (
          <img
            src={preset.expressions.neutral}
            className="w-14 h-14 rounded-full bg-slate-800 object-cover flex-shrink-0"
            alt={preset.name}
          />
        )}
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Character Name"
            value={character.name}
            onChange={(e) => onUpdateName(character.id, e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-2 rounded-lg text-sm focus:border-pink-500 outline-none"
          />
          <select
            value={character.preset_id || ''}
            onChange={(e) => onUpdatePreset(character.id, e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-2 rounded-lg text-sm focus:border-pink-500 outline-none"
          >
            <option value="">-- Select OC --</option>
            <optgroup label="Male">
              {ALL_PRESETS.filter((p) => p.id.startsWith('male')).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            <optgroup label="Female">
              {ALL_PRESETS.filter((p) => p.id.startsWith('female')).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
        {canDelete && (
          <button
            onClick={() => onDeleteCharacter(character.id)}
            className="text-red-400 text-xs font-bold px-2"
          >
            Remove
          </button>
        )}
      </div>

      {/* Affinity list — hanya untuk Sub Character, bukan MC */}
      {!isMc && (
        <div className="space-y-2 pl-1">
          {character.affinities.map((aff) => (
            <div key={aff.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-300">{aff.name}</span>
              <button
                onClick={() => onDeleteAffinity(aff.id, character.id)}
                className="text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Affinity name (e.g. Love, Trust)"
              value={newAffinityName}
              onChange={(e) => setNewAffinityName(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 p-2 rounded-lg text-xs focus:border-pink-500 outline-none"
            />
            <button
              onClick={() => {
                if (!newAffinityName.trim()) return
                onAddAffinity(character.id, newAffinityName.trim())
                setNewAffinityName('')
              }}
              className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-lg text-xs font-bold"
            >
              + Add Affinity
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CharacterSettings() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [loading, setLoading] = useState(true)
  const [mc, setMc] = useState(null)
  const [subCharacters, setSubCharacters] = useState([])

  useEffect(() => {
    init()
  }, [projectId])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/auth')
      return
    }

    const { data: characters, error } = await supabase
      .from('characters')
      .select('*, affinities(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      alert('Failed to load characters: ' + error.message)
      setLoading(false)
      return
    }

    const mcData = characters.find((c) => c.role === 'mc')
    const subData = characters.filter((c) => c.role === 'sub')

    setMc(mcData || null)
    setSubCharacters(subData)
    setLoading(false)
  }

  async function ensureMc() {
    if (mc) return mc

    const { data, error } = await supabase
      .from('characters')
      .insert({ project_id: projectId, role: 'mc', name: 'Main Character' })
      .select('*, affinities(*)')
      .single()

    if (error) {
      alert('Failed to create MC: ' + error.message)
      return null
    }

    setMc(data)
    return data
  }

  async function handleAddSubCharacter() {
    const { data, error } = await supabase
      .from('characters')
      .insert({ project_id: projectId, role: 'sub', name: `Character ${subCharacters.length + 1}` })
      .select('*, affinities(*)')
      .single()

    if (error) {
      alert('Failed to add character: ' + error.message)
      return
    }

    setSubCharacters([...subCharacters, data])
  }

  async function handleUpdateName(characterId, newName) {
    if (mc && mc.id === characterId) {
      setMc({ ...mc, name: newName })
    } else {
      setSubCharacters(subCharacters.map((c) => (c.id === characterId ? { ...c, name: newName } : c)))
    }

    await supabase.from('characters').update({ name: newName }).eq('id', characterId)
  }

  async function handleUpdatePreset(characterId, presetId) {
    if (mc && mc.id === characterId) {
      setMc({ ...mc, preset_id: presetId })
    } else {
      setSubCharacters(subCharacters.map((c) => (c.id === characterId ? { ...c, preset_id: presetId } : c)))
    }

    await supabase.from('characters').update({ preset_id: presetId }).eq('id', characterId)
  }

  async function handleAddAffinity(characterId, affinityName) {
    const { data, error } = await supabase
      .from('affinities')
      .insert({ character_id: characterId, name: affinityName })
      .select()
      .single()

    if (error) {
      alert('Failed to add affinity: ' + error.message)
      return
    }

    setSubCharacters(
      subCharacters.map((c) =>
        c.id === characterId ? { ...c, affinities: [...c.affinities, data] } : c
      )
    )
  }

  async function handleDeleteAffinity(affinityId, characterId) {
    await supabase.from('affinities').delete().eq('id', affinityId)

    setSubCharacters(
      subCharacters.map((c) =>
        c.id === characterId
          ? { ...c, affinities: c.affinities.filter((a) => a.id !== affinityId) }
          : c
      )
    )
  }

  async function handleDeleteSubCharacter(characterId) {
    await supabase.from('characters').delete().eq('id', characterId)
    setSubCharacters(subCharacters.filter((c) => c.id !== characterId))
  }

  async function handleMcClick() {
    if (!mc) {
      await ensureMc()
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
          <button onClick={() => navigate(`/project/${projectId}`)} className="text-2xl">‹</button>
          <h1 className="text-2xl font-black">Character Settings</h1>
        </div>

        <h2 className="text-slate-400 text-sm font-bold mb-2 uppercase tracking-wide">Main Character</h2>
        {mc ? (
          <CharacterCard
            character={mc}
            isMc={true}
            onUpdateName={handleUpdateName}
            onUpdatePreset={handleUpdatePreset}
            canDelete={false}
          />
        ) : (
          <button
            onClick={handleMcClick}
            className="w-full bg-black/40 border border-dashed border-white/20 rounded-2xl p-5 text-slate-400 hover:bg-black/60 transition-all"
          >
            + Set up Main Character
          </button>
        )}

        <h2 className="text-slate-400 text-sm font-bold mt-8 mb-2 uppercase tracking-wide">Sub Characters</h2>
        <div className="space-y-3">
          {subCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              isMc={false}
              onUpdateName={handleUpdateName}
              onUpdatePreset={handleUpdatePreset}
              onAddAffinity={handleAddAffinity}
              onDeleteAffinity={handleDeleteAffinity}
              canDelete={true}
              onDeleteCharacter={handleDeleteSubCharacter}
            />
          ))}
        </div>

        <button
          onClick={handleAddSubCharacter}
          className="w-full mt-3 bg-black/40 border border-dashed border-white/20 rounded-2xl p-4 text-slate-400 hover:bg-black/60 transition-all"
        >
          + Add Sub Character
        </button>
      </div>
    </div>
  )
}

export default CharacterSettings
