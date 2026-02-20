import { readdir } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i

/**
 * Returns a sorted JSON array of image paths found in /public/gallery.
 * Adding images to that folder automatically exposes them in the gallery.
 */
export async function GET() {
  try {
    const dir = join(process.cwd(), 'public', 'gallery')
    const files = await readdir(dir)
    const images = files
      .filter((f) => IMAGE_RE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/gallery/${f}`)

    return NextResponse.json(images)
  } catch {
    return NextResponse.json([])
  }
}
