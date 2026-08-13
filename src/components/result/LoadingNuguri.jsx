import { useEffect, useState } from 'react'

const FRAMES = [
  '/images/cute-nuguri.png',
  '/images/mukbang-nuguri.png',
  '/images/nuguri1.png',
  '/images/nuguri2.png',
  '/images/nuguri3.png',
  '/images/nuguri4.png',
  '/images/nuguri5.png',
  '/images/socute-nuguri.png',
]

const INTERVAL_MS = 1600

export default function LoadingNuguri() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % FRAMES.length)
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="nuguri-loader" aria-hidden="true">
      {FRAMES.map((src, frameIndex) => (
        <img
          key={src}
          className={
            frameIndex === index
              ? 'nuguri-loader-frame is-active'
              : 'nuguri-loader-frame'
          }
          src={src}
          alt=""
          width={320}
          height={320}
          decoding="async"
        />
      ))}
    </div>
  )
}
