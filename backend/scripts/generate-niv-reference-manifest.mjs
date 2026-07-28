import fs from 'node:fs'
import path from 'node:path'

const [sourceDirectory, destination] = process.argv.slice(2)

if (!sourceDirectory || !destination) {
  throw new Error(
    'Usage: node generate-niv-reference-manifest.mjs <Bible-niv directory> <destination>',
  )
}

const bookNames = JSON.parse(
  fs.readFileSync(path.join(sourceDirectory, 'Books.json'), 'utf8'),
)

const manifest = bookNames.map((bookName) => {
  const book = JSON.parse(
    fs.readFileSync(path.join(sourceDirectory, `${bookName}.json`), 'utf8'),
  )

  return {
    book: bookName,
    chapterVerseCounts: book.chapters.map(
      (chapter) => chapter.verses.length,
    ),
    omitted: book.chapters.flatMap((chapter) =>
      chapter.verses
        .filter((verse) => !verse.text.trim())
        .map((verse) => `${chapter.chapter}:${verse.verse}`),
    ),
  }
})

fs.writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`)
