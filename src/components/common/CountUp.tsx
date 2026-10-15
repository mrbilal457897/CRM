import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  duration?: number
  decimals?: number
  className?: string
  prefix?: string
  suffix?: string
  formatter?: (value: number) => string
}

export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  className,
  prefix,
  suffix,
  formatter,
}: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplay(value)
      return
    }

    fromRef.current = 0
    startRef.current = null

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(fromRef.current + (value - fromRef.current) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  const rendered = formatter
    ? formatter(display)
    : `${prefix ?? ''}${display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix ?? ''}`

  return <span className={className}>{rendered}</span>
}
