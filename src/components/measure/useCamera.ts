import { useEffect, useRef, useState } from 'react'

export type CameraStatus = 'pending' | 'active' | 'denied'
export type Facing = 'environment' | 'user'

/**
 * Manages a getUserMedia video stream bound to a <video> element.
 * `enabled` lets the caller pause acquisition (e.g. demo scene mode).
 */
export function useCamera(facing: Facing, enabled: boolean, retrySeed: number) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<CameraStatus>(enabled ? 'pending' : 'denied')
  const [deviceCount, setDeviceCount] = useState(1)

  useEffect(() => {
    if (!enabled) {
      setStatus('denied')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('denied')
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    setStatus('pending')

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        if (video) {
          video.srcObject = s
          await video.play().catch(() => undefined)
        }
        setStatus('active')
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const count = devices.filter((d) => d.kind === 'videoinput').length
          if (!cancelled) setDeviceCount(Math.max(1, count))
        } catch {
          /* enumeration unavailable — keep single-camera assumption */
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('denied')
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing, enabled, retrySeed])

  return { videoRef, status, deviceCount }
}
