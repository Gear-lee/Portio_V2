import { getPresetById } from '../../data/presetCharacters'
import { ENTER_EXIT_EFFECTS, REACTION_EFFECTS } from '../../data/effectOptions'

const EXPRESSIONS = ['neutral', 'smile', 'laugh', 'angry', 'sad']

function SpritePicker({ characters, sprite, onChange, onRemove, canRemove }) {
  const selectedCharacter = characters.find((c) => c.id === sprite.sprite_character_id)
  const preset = selectedCharacter ? getPresetById(selectedCharacter.preset_id) : null

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-slate-400 text-sm">Sprite</label>
        {canRemove && (
          <button onClick={onRemove} className="text-red-400 text-xs font-bold">
            Remove
          </button>
        )}
      </div>

      {/* Position */}
      <div className="flex gap-2">
        {['left', 'center', 'right'].map((pos) => (
          <button
            key={pos}
            onClick={() => onChange('position', pos)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              sprite.position === pos ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
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

      {sprite.sprite_mode && (
        <div className="grid grid-cols-3 gap-2">
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
