// Dummy preset characters - nanti diganti dengan aset asli
const expressions = ['neutral', 'smile', 'laugh', 'angry', 'sad']

function generateDummyExpressions(seed) {
  const result = {}
  expressions.forEach((exp) => {
    result[exp] = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}-${exp}`
  })
  return result
}

export const MALE_PRESETS = [
  { id: 'male_1', name: 'Daniel', expressions: generateDummyExpressions('daniel') },
  { id: 'male_2', name: 'Kevin', expressions: generateDummyExpressions('kevin') },
  { id: 'male_3', name: 'Aiden', expressions: generateDummyExpressions('aiden') },
  { id: 'male_4', name: 'Marcus', expressions: generateDummyExpressions('marcus') },
  { id: 'male_5', name: 'Ryan', expressions: generateDummyExpressions('ryan') },
]

export const FEMALE_PRESETS = [
  { id: 'female_1', name: 'Vera', expressions: generateDummyExpressions('vera') },
  { id: 'female_2', name: 'Alice', expressions: generateDummyExpressions('alice') },
  { id: 'female_3', name: 'Mia', expressions: generateDummyExpressions('mia') },
  { id: 'female_4', name: 'Sophia', expressions: generateDummyExpressions('sophia') },
  { id: 'female_5', name: 'Emma', expressions: generateDummyExpressions('emma') },
  { id: 'female_6', name: 'Luna', expressions: generateDummyExpressions('luna') },
  { id: 'female_7', name: 'Zoe', expressions: generateDummyExpressions('zoe') },
  { id: 'female_8', name: 'Nina', expressions: generateDummyExpressions('nina') },
  { id: 'female_9', name: 'Clara', expressions: generateDummyExpressions('clara') },
  { id: 'female_10', name: 'Ivy', expressions: generateDummyExpressions('ivy') },
]

export const ALL_PRESETS = [...MALE_PRESETS, ...FEMALE_PRESETS]

export function getPresetById(id) {
  return ALL_PRESETS.find((p) => p.id === id)
}
