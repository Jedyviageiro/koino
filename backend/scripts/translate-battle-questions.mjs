import fs from 'node:fs/promises'
import path from 'node:path'

const backendRoot = path.resolve(import.meta.dirname, '..')
const env = await readEnv(path.join(backendRoot, '.env'))
const apiKey = process.env.GEMINI_KEY || env.GEMINI_KEY
const model = process.env.GEMINI_MODEL || env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
const includeGenerated = process.argv.includes('--all')
const files = [
  path.join(backendRoot, 'src/main/resources/battle/battle-question-catalog.json'),
  ...(includeGenerated
    ? [path.join(backendRoot, 'data/battle-question-catalog.generated.json')]
    : []),
]

if (!apiKey) throw new Error('GEMINI_KEY is not configured')

for (const file of files) {
  const questions = JSON.parse(await fs.readFile(file, 'utf8'))
  const pending = questions.filter((question) => !question.promptPt)
  for (let offset = 0; offset < pending.length; offset += 12) {
    const batch = pending.slice(offset, offset + 12)
    const translated = await translate(batch)
    const translationsByKey = new Map(
      translated.map((item) => [item.catalogKey, item]),
    )
    for (const question of questions) {
      const translation = translationsByKey.get(question.catalogKey)
      if (translation) Object.assign(question, translation)
    }
    await fs.writeFile(file, `${JSON.stringify(questions, null, 2)}\n`, 'utf8')
    process.stdout.write(
      `${path.basename(file)}: ${Math.min(offset + batch.length, pending.length)}/${pending.length}\n`,
    )
  }
}

async function translate(questions) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate these Bible quiz questions into natural Brazilian Portuguese. Preserve catalogKey, meaning, answer order, proper names, and Bible references. Do not answer or rewrite the question. Return exactly one item per input with catalogKey, promptPt, four optionsPt, categoryPt, and one concise explanationPt.\n\n${JSON.stringify(questions)}`,
          }],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8000,
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                catalogKey: { type: 'STRING' },
                promptPt: { type: 'STRING' },
                optionsPt: { type: 'ARRAY', items: { type: 'STRING' } },
                categoryPt: { type: 'STRING' },
                explanationPt: { type: 'STRING' },
              },
              required: [
                'catalogKey', 'promptPt', 'optionsPt',
                'categoryPt', 'explanationPt',
              ],
            },
          },
        },
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}: ${await response.text()}`)
  }
  const payload = await response.json()
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  const translated = JSON.parse(text || '[]')
  if (translated.length !== questions.length
      || translated.some((item) => item.optionsPt?.length !== 4)) {
    throw new Error('Gemini returned an incomplete translation batch')
  }
  return translated
}

async function readEnv(file) {
  try {
    const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/)
    return Object.fromEntries(lines.flatMap((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
      if (!match) return []
      return [[match[1], match[2].replace(/^['"]|['"]$/g, '')]]
    }))
  } catch {
    return {}
  }
}
