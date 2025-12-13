import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  trail: { x: number; y: number }[]
}

interface Orb {
  x: number
  y: number
  radius: number
  hue: number
  pulseSpeed: number
}

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let animationId: number
    let time = 0

    canvas.width = width
    canvas.height = height

    // Create stars
    const stars: Star[] = []
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      })
    }

    // Create particles
    const particles: Particle[] = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        hue: Math.random() * 60 + 180, // Cyan to blue range
        trail: [],
      })
    }

    // Create glowing orbs
    const orbs: Orb[] = [
      { x: width * 0.2, y: height * 0.3, radius: 250, hue: 190, pulseSpeed: 0.015 },
      { x: width * 0.8, y: height * 0.7, radius: 200, hue: 270, pulseSpeed: 0.02 },
      { x: width * 0.5, y: height * 0.15, radius: 180, hue: 220, pulseSpeed: 0.018 },
    ]

    function drawStars() {
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7
        const alpha = star.brightness * twinkle
        
        ctx!.beginPath()
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx!.fill()

        // Add glow to brighter stars
        if (star.brightness > 0.7) {
          const glow = ctx!.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4)
          glow.addColorStop(0, `rgba(150, 200, 255, ${alpha * 0.3})`)
          glow.addColorStop(1, 'transparent')
          ctx!.beginPath()
          ctx!.fillStyle = glow
          ctx!.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2)
          ctx!.fill()
        }
      })
    }

    function drawOrbs() {
      orbs.forEach((orb, i) => {
        const pulse = Math.sin(time * orb.pulseSpeed) * 0.2 + 1
        const currentRadius = orb.radius * pulse

        // Animate position slightly
        const ox = orb.x + Math.sin(time * 0.008 + i) * 20
        const oy = orb.y + Math.cos(time * 0.012 + i) * 15

        const gradient = ctx!.createRadialGradient(ox, oy, 0, ox, oy, currentRadius)
        gradient.addColorStop(0, `hsla(${orb.hue}, 70%, 50%, 0.08)`)
        gradient.addColorStop(0.5, `hsla(${orb.hue + 20}, 60%, 40%, 0.03)`)
        gradient.addColorStop(1, 'transparent')

        ctx!.beginPath()
        ctx!.fillStyle = gradient
        ctx!.arc(ox, oy, currentRadius, 0, Math.PI * 2)
        ctx!.fill()
      })
    }

    function drawParticles() {
      particles.forEach((p, i) => {
        // Update trail
        p.trail.unshift({ x: p.x, y: p.y })
        if (p.trail.length > 6) p.trail.pop()

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Mouse interaction
        if (mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x
          const dy = p.y - mouseRef.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.08
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        // Limit velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 1.5) {
          p.vx = (p.vx / speed) * 1.5
          p.vy = (p.vy / speed) * 1.5
        }

        // Draw trail
        p.trail.forEach((point, idx) => {
          const alpha = (1 - idx / p.trail.length) * 0.3
          ctx!.beginPath()
          ctx!.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`
          ctx!.arc(point.x, point.y, p.size * (1 - idx / p.trail.length), 0, Math.PI * 2)
          ctx!.fill()
        })

        // Draw particle with glow
        const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5)
        glow.addColorStop(0, `hsla(${p.hue}, 80%, 70%, 0.4)`)
        glow.addColorStop(0.5, `hsla(${p.hue}, 80%, 70%, 0.1)`)
        glow.addColorStop(1, 'transparent')

        ctx!.beginPath()
        ctx!.fillStyle = glow
        ctx!.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2)
        ctx!.fill()

        ctx!.beginPath()
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 80%, 0.9)`
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx!.beginPath()
            ctx!.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 70%, 60%, ${0.12 * (1 - dist / 120)})`
            ctx!.lineWidth = 0.5
            ctx!.moveTo(p.x, p.y)
            ctx!.lineTo(p2.x, p2.y)
            ctx!.stroke()
          }
        }
      })
    }

    function drawMouseGlow() {
      if (mouseRef.current.active) {
        const gradient = ctx!.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 100
        )
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)')
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)')
        gradient.addColorStop(1, 'transparent')

        ctx!.beginPath()
        ctx!.fillStyle = gradient
        ctx!.arc(mouseRef.current.x, mouseRef.current.y, 100, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function draw() {
      time++

      // Clear with dark background
      ctx!.fillStyle = '#0a0e17'
      ctx!.fillRect(0, 0, width, height)

      drawOrbs()
      drawStars()
      drawParticles()
      drawMouseGlow()

      animationId = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height

      // Update orb positions
      orbs[0].x = width * 0.2
      orbs[0].y = height * 0.3
      orbs[1].x = width * 0.8
      orbs[1].y = height * 0.7
      orbs[2].x = width * 0.5
      orbs[2].y = height * 0.15
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    const cleanup = animate()
    return cleanup
  }, [animate])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none -z-10"
      />

      {/* Gradient overlays */}
      <div
        className="fixed inset-0 pointer-events-none -z-5"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(59, 130, 246, 0.04) 0%, transparent 40%)
          `,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none -z-5 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div
        className="fixed inset-0 pointer-events-none -z-5"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </>
  )
}
