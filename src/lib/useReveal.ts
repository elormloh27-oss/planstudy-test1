import { useEffect, useRef } from 'react'

export default function useRevealRoot<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('.reveal,.reveal-soft').forEach((el) => el.classList.add('reveal-in'))
      return
    }
    const els = root.querySelectorAll('.reveal,.reveal-soft')
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('reveal-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('reveal-in')
            io.unobserve(en.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
} 
