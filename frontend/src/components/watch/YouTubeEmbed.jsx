import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

let youtubeApiPromise

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve(window.YT)
    }

    const existing = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    )
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      youtubeApiPromise = null
      reject(new Error('YouTube player failed to load'))
    }
    document.head.appendChild(script)
  })

  return youtubeApiPromise
}

const YouTubeEmbed = forwardRef(function YouTubeEmbed(
  {
    videoId,
    title,
    startSeconds = 0,
    autoplay = false,
    className = '',
    onProgress,
  },
  ref,
) {
  const mountRef = useRef(null)
  const playerRef = useRef(null)
  const progressRef = useRef(onProgress)
  const initialStartRef = useRef(Math.max(0, Number(startSeconds) || 0))
  const [failed, setFailed] = useState(false)
  const [playerError, setPlayerError] = useState(false)

  progressRef.current = onProgress

  useImperativeHandle(ref, () => ({
    getCurrentTime() {
      return readCurrentTime(playerRef.current, initialStartRef.current)
    },
  }), [])

  useEffect(() => {
    let active = true
    let progressTimer
    const initialStart = initialStartRef.current

    loadYouTubeApi()
      .then((YT) => {
        if (!active || !mountRef.current) return
        playerRef.current = new YT.Player(mountRef.current, {
          host: 'https://www.youtube.com',
          videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            start: Math.floor(initialStart),
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              progressTimer = window.setInterval(() => {
                progressRef.current?.(
                  readCurrentTime(playerRef.current, initialStart),
                )
              }, 1000)
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                progressRef.current?.(0)
              }
            },
            onError: () => {
              if (active) setPlayerError(true)
            },
          },
        })
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
      window.clearInterval(progressTimer)
      progressRef.current?.(
        readCurrentTime(playerRef.current, initialStart),
      )
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [autoplay, videoId])

  if (playerError) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-[#111317] px-8 text-center ${className}`}>
        <div>
          <p className="text-[12px] font-semibold text-white">
            This video cannot play inside Koino right now.
          </p>
          <p className="mt-2 text-[9px] leading-4 text-white/60">
            Try another video from the queue while this one becomes available.
          </p>
        </div>
      </div>
    )
  }

  if (failed) {
    const start = Math.floor(initialStartRef.current)
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&start=${start}&origin=${encodeURIComponent(window.location.origin)}`}
        title={title}
        className={`h-full w-full border-0 ${className}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    )
  }

  return <div ref={mountRef} className={`h-full w-full ${className}`} />
})

function readCurrentTime(player, fallback) {
  try {
    const value = player?.getCurrentTime?.()
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}

export default YouTubeEmbed
