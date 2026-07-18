export const FONT_OPTIONS = [
  { id: 'default', name: 'Default (System)', family: 'inherit' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif" },
  { id: 'nunito', name: 'Nunito', family: "'Nunito', sans-serif" },
  { id: 'quicksand', name: 'Quicksand', family: "'Quicksand', sans-serif" },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif" },
  { id: 'merriweather', name: 'Merriweather', family: "'Merriweather', serif" },
  { id: 'baloo', name: 'Baloo 2', family: "'Baloo 2', cursive" },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif" },
]

export function getFontById(id) {
  return FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0]
}
