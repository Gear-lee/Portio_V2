import { useEffect, useState } from 'react'
import { getPresetById } from '../../data/presetCharacters'
import { ENTER_EXIT_EFFECTS, REACTION_EFFECTS } from '../../data/effectOptions'

const EXPRESSIONS = ['neutral', 'smile', 'laugh', 'angry', 'sad']

function SpritePicker({ characters, sprite, onChange, onRemove, canRemove }) {
  const selectedCharacter = characters.find((c) => c.id === sprite.sprite_character_id)
  const preset = selectedCharacter ? getPresetById(selectedCharacter.preset_id) : null

  // Local state biar slider lincah dan ga tabrakan ama debounce database
  const [localX, setLocalX] = useState(sprite.position || 50)
  const [localY, setLocalY] = useState(sprite.sprite_y_offset || 0)
  const [localZoom, setLocalZoom] = useState(sprite.sprite_zoom || 100)

  // Sinkronisasi ulang local state kalau page-nya beneran berganti
  useEffect(() => {
    setLocalX(sprite.position || 50)
    setLocalY(sprite.sprite_y_offset || 0)
    setLocalZoom(sprite.sprite_zoom || 100)
  }, [sprite.id, sprite.position, sprite.sprite_y_offset, sprite.sprite_zoom])

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-slate-400 text-sm font-bold">Sprite</label>
        {canRemove && (
          <button onClick={onRemove} className="text-red-400 text-xs font-bold">
            Remove
          </button>
        )}
      </div>

      {/* --- Kumpulan Slider Transformasi di Atas --- */}
      <div className="space-y-4">
        {/* Horizontal Position */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Horizontal Position</span>
            <span>{localX}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={localX} 
            onChange={(e) => setLocalX(parseInt(e.target.value, 10))}
            onMouseUp={() => onChange('position', localX)}
            onTouchEnd={() => onChange('position', localX)}
            className="w-full h-2 bg-pink-600 rounded-lg appearance-none cursor-pointer" 
          />
        </div>

        {/* Vertical Position */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Vertical Position</span>
            <span>{localY}</span>
          </div>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={localY} 
            onChange={(e) => setLocalY(parseInt(e.target.value, 10))}
            onMouseUp={() => onChange('sprite_y_offset', localY)}
            onTouchEnd={() => onChange('sprite_y_offset', localY)}
            className="w-full h-2 bg-green-600 rounded-lg appearance-none cursor-pointer" 
          />
        </div>

        {/* Zoom */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Zoom</span>
            <span>{localZoom}%</span>
          </div>
          <input 
            type="range" 
            min="100" 
            max="250" 
            value={localZoom} 
            onChange={(e) => setLocalZoom(parseInt(e.target.value, 10))}
            onMouseUp={() => onChange('sprite_zoom', localZoom)}
            onTouchEnd={() => onChange('sprite_zoom', localZoom)}
            className="w-full h-2 bg-blue-600 rounded-lg appearance-none cursor-pointer" 
          />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <button
          onClick={() => onChange('sprite_mode', 'preset')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            sprite.sprite_mode === 'preset' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          Character Preset
        </button>
        <button
          onClick={() => onChange('sprite_mode', 'embed')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
            sprite.sprite_mode === 'embed' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          Embed Image
        </button>
      </div>

      {sprite.sprite_mode === 'preset' && (
        <div className="space-y-3">
          <select
            value={sprite.sprite_character_id || ''}
            onChange={(e) => onChange('sprite_character_id', e.target.value)}
            className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm focus:border-pink-500 outline-none"
          >
            <option value="">-- Select Character --</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.role === 'mc' ? '(MC)' : ''}
              </option>
            ))}
          </select>

          {selectedCharacter && preset && (
            <div className="grid grid-cols-5 gap-2">
              {EXPRESSIONS.map((exp) => (
                <button
                  key={exp}
                  onClick={() => onChange('sprite_expression', exp)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    sprite.sprite_expression === exp ? 'bg-pink-600/20 border-2 border-pink-500' : 'bg-slate-900 border-2 border-transparent'
                  }`}
                >
                  <img src={preset.expressions[exp]} className="w-10 h-10 rounded-full object-cover" alt={exp} />
                  <span className="text-[9px] text-slate-400 capitalize">{exp}</span>
                </button>
              ))}
            </div>
          )}

          {selectedCharacter && !preset && (
            <p className="text-slate-500 text-xs">
              This character doesn't have a preset OC set.
            </p>
          )}
        </div>
      )}

      {sprite.sprite_mode === 'embed' && (
        <input
          type="text"
          placeholder="https://..."
          value={sprite.sprite_embed || ''}
          onChange={(e) => onChange('sprite_embed', e.target.value)}
          className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl text-sm focus:border-pink-500 outline-none"
        />
      )}

      {/* Bagian Efek Bawaan */}
      {sprite.sprite_mode && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Enter</label>
            <select
              value={sprite.sprite_enter_effect || 'none'}
              onChange={(e) => onChange('sprite_enter_effect', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-2 rounded-lg text-xs focus:border-pink-500 outline-none"
            >
              {ENTER_EXIT_EFFECTS.map((eff) => (
                <option key={eff.id} value={eff.id}>{eff.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Exit</label>
            <select
              value={sprite.sprite_exit_effect || 'none'}
              onChange={(e) => onChange('sprite_exit_effect', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-2 rounded-lg text-xs focus:border-pink-500 outline-none"
            >
              {ENTER_EXIT_EFFECTS.map((eff) => (
                <option key={eff.id} value={eff.id}>{eff.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Reaction</label>
            <select
              value={sprite.sprite_reaction_effect || 'none'}
              onChange={(e) => onChange('sprite_reaction_effect', e.target.value)}
              className="w-full bg-slate-900 border border-white/10 p-2 rounded-lg text-xs focus:border-pink-500 outline-none"
            >
              {REACTION_EFFECTS.map((eff) => (
                <option key={eff.id} value={eff.id}>{eff.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpritePicker
