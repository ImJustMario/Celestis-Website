'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'

/* ────────────────────────────────────────────
   Gallery — organic masonry collage via CSS columns
   with lightbox overlay on click
   ──────────────────────────────────────────── */

interface GalleryImage {
  src: string
  thumbnailSrc: string
  alt: string
}

interface GalleryResponse {
  images: Array<{
    src: string
    thumbnailSrc: string
    sizeBytes: number
  }>
  maxImageBytes: number
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [ready, setReady] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [fullLoaded, setFullLoaded] = useState(false)

  /* Fetch image list from the API route that reads /public/gallery */
  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((payload: GalleryResponse) => {
        setImages(
          payload.images.map((image, i) => ({
            src: image.src,
            thumbnailSrc: image.thumbnailSrc,
            alt: `Celestis project — image ${i + 1}`,
          }))
        )
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [])

  useEffect(() => {
    setFullLoaded(false)
  }, [selectedIdx])

  /* ── Lightbox keyboard controls ── */
  const closeLightbox = useCallback(() => setSelectedIdx(null), [])
  const prev = useCallback(
    () =>
      setSelectedIdx((i) =>
        i !== null ? (i - 1 + images.length) % images.length : null
      ),
    [images.length]
  )
  const next = useCallback(
    () =>
      setSelectedIdx((i) =>
        i !== null ? (i + 1) % images.length : null
      ),
    [images.length]
  )

  useEffect(() => {
    if (selectedIdx === null) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', handle)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handle)
      document.body.style.overflow = ''
    }
  }, [selectedIdx, closeLightbox, prev, next])

  if (!ready || images.length === 0) return null

  return (
    <>
      {/* ── Collage layout ── */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {images.map((img, index) => (
          <motion.div
            key={img.src}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.6,
              delay: index * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-4 break-inside-avoid cursor-pointer group relative overflow-hidden rounded-2xl shadow-soft hover:shadow-card transition-shadow duration-300"
            onClick={() => setSelectedIdx(index)}
          >
            <img
              src={img.thumbnailSrc}
              alt={img.alt}
              className="w-full h-auto block transition-all duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
            {/* Subtle vignette on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-white/95 backdrop-blur-xl flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close */}
            <LightboxButton
              onClick={closeLightbox}
              label="Close"
              className="absolute top-5 right-5"
            >
              <XMarkIcon className="w-5 h-5" />
            </LightboxButton>

            {/* Prev */}
            <LightboxButton
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </LightboxButton>

            {/* Next */}
            <LightboxButton
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </LightboxButton>

            {/* Image */}
            <div
              className="relative max-w-[90vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[selectedIdx].thumbnailSrc}
                alt={images[selectedIdx].alt}
                className={`max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none blur-sm transition-opacity duration-200 ${
                  fullLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
                }`}
                draggable={false}
              />
              <motion.img
                key={selectedIdx}
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                src={images[selectedIdx].src}
                alt={images[selectedIdx].alt}
                className={`max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none transition-opacity duration-300 ${
                  fullLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setFullLoaded(true)}
                draggable={false}
              />
            </div>

            {/* Counter */}
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-ink-muted text-sm tabular-nums select-none">
              {selectedIdx + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Shared lightbox button ── */
function LightboxButton({
  onClick,
  label,
  className = '',
  children,
}: {
  onClick: (e: React.MouseEvent) => void
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 text-ink hover:bg-black/10 transition-colors duration-200 cursor-pointer ${className}`}
      aria-label={label}
    >
      {children}
    </button>
  )
}
