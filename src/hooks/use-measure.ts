import { useState, useCallback, useRef, useEffect } from "react"

export function useMeasure(): [
  (element: HTMLElement | null) => void,
  {
    width: number
    height: number
    top: number
    left: number
    bottom: number
    right: number
    x: number
    y: number
  }
] {
  const [rect, setRect] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
  })

  const observerRef = useRef<ResizeObserver | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const ref = useCallback((element: HTMLElement | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }

    elementRef.current = element

    if (element) {
      if (!observerRef.current) {
        observerRef.current = new ResizeObserver((entries) => {
          if (!entries || !entries[0]) return
          const { width, height, top, left, bottom, right, x, y } =
            entries[0].contentRect
          setRect({ width, height, top, left, bottom, right, x, y })
        })
      }
      observerRef.current.observe(element)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return [ref, rect]
}

export default useMeasure
