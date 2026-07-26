const MAX_SOURCE_BYTES = 20 * 1024 * 1024
const MAX_OUTPUT_BYTES = 4.5 * 1024 * 1024
const MAX_DIMENSION = 2048

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('This photo could not be compressed.')),
      type,
      quality,
    )
  })
}

async function loadImage(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file, { imageOrientation: 'from-image' })
  }

  const source = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = source
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(source)
  }
}

export async function compressCommunityImage(file) {
  if (!file?.type.startsWith('image/')) {
    throw new Error('Choose a valid image file.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Choose a photo smaller than 20 MB.')
  }

  let image
  try {
    image = await loadImage(file)
  } catch {
    throw new Error('This image format cannot be processed in your browser.')
  }

  const sourceWidth = image.width || image.naturalWidth
  const sourceHeight = image.height || image.naturalHeight
  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)
  image.close?.()

  let compressed
  for (const quality of [0.84, 0.72, 0.6]) {
    compressed = await canvasToBlob(canvas, 'image/webp', quality)
    if (compressed.size <= MAX_OUTPUT_BYTES) break
  }

  if (
    scale === 1 &&
    file.size <= MAX_OUTPUT_BYTES &&
    compressed.size >= file.size
  ) {
    return file
  }
  if (compressed.size > MAX_OUTPUT_BYTES) {
    throw new Error('This photo is still too large after compression.')
  }

  const basename = file.name.replace(/\.[^.]+$/, '') || 'community-photo'
  return new File([compressed], `${basename}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
