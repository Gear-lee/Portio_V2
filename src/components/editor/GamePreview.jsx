function GamePreview({ backgroundEmbed, sprites, dialogName, dialogText, choices = [] }) {
  // Arsitektur Future-Proof Opacity Tokens
  const choiceBoxOpacity = 0.5; 
  const dialogBoxOpacity = 0.8; 
  const nameBoxOpacity = 0.9;   

  // Rumus Auto-Resize Font dinamis agar tulisan mengecil otomatis jika sangat panjang
  const getTextFontSize = (text) => {
    if (!text) return 'text-[11px]';
    const len = text.length;
    if (len > 150) return 'text-[8.5px] leading-tight';
    if (len > 90) return 'text-[9.5px] leading-snug';
    return 'text-[11px] leading-normal';
  };

  return (
    <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl flex flex-col justify-end">
      
      {/* 1. Background Scene Layer */}
      <div className="absolute inset-0 z-0">
        {backgroundEmbed ? (
          <img 
            src={backgroundEmbed} 
            className="w-full h-full object-cover select-none pointer-events-none" 
            alt="Scene Background" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600 text-xs">
            No background set
          </div>
        )}
      </div>

      {/* 2. Character Sprites Layer */}
      <div className="absolute inset-0 z-10 flex justify-center items-end overflow-hidden pointer-events-none select-none">
        {sprites.map((sprite, idx) => {
          if (!sprite.url) return null
          
          const leftPos = `${sprite.position}%`
          const zoomScale = (sprite.sprite_zoom || 100) / 100
          const yOffset = `${sprite.sprite_y_offset || 0}px`

          return (
            <img
              key={idx}
              src={sprite.url}
              alt="Character Sprite"
              className="absolute max-h-[85%] object-contain transition-all duration-300 ease-out"
              style={{
                left: leftPos,
                transform: `translateX(-50%) scale(${zoomScale}) translateY(${yOffset})`,
                transformOrigin: 'bottom center',
                bottom: '0px'
              }}
            />
          )
        })}
      </div>

      {/* Kontainer Utama UI (Choices + Dialog) Terkunci Aman Menempel ke Bawah */}
      <div className="w-full z-20 flex flex-col justify-end pointer-events-none">
        
        {/* 3. Box Choices Area (Diciutkan Mungil, Teks 7px, dan Dinaikkan ke atas character name dengan pb-4) */}
        {choices.length > 0 && (
          <div className="w-full flex flex-col items-center px-4 pb-8 gap-1 pointer-events-auto">
            {choices.map((choice) => (
              <div
                key={choice.id}
                className="w-1/3 max-w-[110px] border border-white/15 text-center text-[7px] text-white py-0.5 px-2 rounded-md shadow-md backdrop-blur-sm select-none truncate"
                style={{
                  backgroundColor: `rgba(9, 9, 11, ${choiceBoxOpacity})`
                }}
              >
                {choice.choice_text || 'Choice'}
              </div>
            ))}
          </div>
        )}

        {/* 4. UI Dialogue Box Layer */}
        {(dialogName || dialogText) && (
          <div className="w-full p-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto relative max-h-[30%] flex flex-col justify-end">
            <div className="w-full max-w-2xl mx-auto flex flex-col justify-end h-full">
              
              {/* Box Nama Karakter */}
              {dialogName && (
                <div 
                  className="inline-block self-start text-[9px] font-black tracking-wider uppercase text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-md shadow-sm backdrop-blur-sm mb-1"
                  style={{
                    backgroundColor: `rgba(15, 23, 42, ${nameBoxOpacity})`
                  }}
                >
                  {dialogName}
                </div>
              )}
              
              {/* Box Teks Cerita Dialog */}
              <div 
                className={`w-full border border-white/5 rounded-xl p-2 h-full min-h-[42px] text-slate-200 shadow-lg backdrop-blur-md overflow-hidden flex items-center ${getTextFontSize(dialogText)}`}
                style={{
                  backgroundColor: `rgba(15, 23, 42, ${dialogBoxOpacity})`
                }}
              >
                <p className="w-full">{dialogText || '...'}</p>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  )
}
export default GamePreview
