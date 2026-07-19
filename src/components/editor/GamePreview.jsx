import { useEffect, useRef, useState } from 'react'

const POSITION_CLASSES = {
  left: 'left-[10%] -translate-x-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-[10%] left-auto translate-x-0',
}

function GamePreview({ backgroundEmbed, sprites = [], dialogName, dialogText }) {
  const textRef = useRef(null)
  const boxRef = useRef(null)
  const [fontSize, setFontSize] = useState(13)

  useEffect(() => {
    if (!textRef.current || !boxRef.current) return

    let size = 13
    setFontSize(size)

    const maxHeight = boxRef.current.clientHeight

    const checkFit = () => {
      if (textRef.current.scrollHeight > maxHeight && size > 8) {
        size -= 1
        setFontSize(size)
      }
    }

    const interval = setInterval(() => {
      if (textRef.current.scrollHeight <= maxHeight || size <= 8) {
        clearInterval(interval)
      } else {
        checkFit()
      }
    }, 10)

    return () => clearInterval(interval)
  }, [dialogText, dialogName])

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-black border border-white/10">
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        {backgroundEmbed ? (
          <img
            src={backgroundEmbed}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
            alt="background"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
            <p className="text-slate-600 text-xs">No background set</p>
          </div>
        )}

        {sprites.map((sprite, idx) => {
          if (!sprite.url) return null
          const posClass = POSITION_CLASSES[sprite.position] || POSITION_CLASSES.center
          return (
            <img
              key={idx}
              src={sprite.url}
              className={`absolute bottom-0 h-[85%] object-contain ${posClass}`}
              alt={`sprite-${idx}`}
            />
          )
        })}

        {(dialogName || dialogText) && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end" style={{ height: '35%' }}>
            {dialogName && (
              <div className="ml-3 flex-shrink-0">
                <span className="inline-block bg-pink-600 text-white font-bold px-3 py-0.5 rounded-t-md" style={{ fontSize: '10px' }}>
                  {dialogName}
                </span>
              </div>
            )}

            <div
              ref={boxRef}
              className="bg-black/80 backdrop-blur-sm p-3 overflow-hidden flex-1"
              style={{ marginTop: dialogName ? '-1px' : '0' }}
            >
              <div ref={textRef}>
                {dialogText && (
                  <p className="text-white leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                    {dialogText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GamePreview
