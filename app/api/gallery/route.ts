import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const THUMBNAIL_WIDTH = 640
const THUMBNAIL_QUALITY = 10

interface GalleryItem {
  src: string
  thumbnailSrc: string
  sizeBytes: number
}

/**
 * Returns a sorted JSON array of gallery images found in /public/gallery.
 * Adding images to that folder automatically exposes them in the gallery.
 * Images above MAX_IMAGE_BYTES are skipped to avoid heavy payloads.
 */
export async function GET() {
  try {
    const dir = join(process.cwd(), 'public', 'gallery')
    const files = await readdir(dir)

    const candidates = files
      .filter((fileName) => IMAGE_RE.test(fileName))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const imageEntries = await Promise.all(
      candidates.map(async (fileName) => {
        const filePath = join(dir, fileName)
        const fileStats = await stat(filePath)

        if (!fileStats.isFile() || fileStats.size > MAX_IMAGE_BYTES) {
          return null
        }

        const src = `/gallery/${fileName}`
        const isSvg = fileName.toLowerCase().endsWith('.svg')
        const thumbnailSrc = isSvg
          ? src
          : `/_next/image?url=${encodeURIComponent(src)}&w=${THUMBNAIL_WIDTH}&q=${THUMBNAIL_QUALITY}`

        const item: GalleryItem = {
          src,
          thumbnailSrc,
          sizeBytes: fileStats.size,
        }

        return item
      })
    )

    const images = imageEntries.filter((item): item is GalleryItem => item !== null)

    return NextResponse.json({
      images,
      maxImageBytes: MAX_IMAGE_BYTES,
    })
  } catch {
    return NextResponse.json({
      images: [],
      maxImageBytes: MAX_IMAGE_BYTES,
    })
  }
}
