import { useEffect, useRef } from 'react'

export default function CreativeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
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

    // Aurora waves
    const waves = [
      { amplitude: 80, frequency: 0.002, speed: 0.02, color: 'rgba(99, 102, 241, 0.15)', yOffset: 0.3 },
      { amplitude: 60, frequency: 0.003, speed: 0.015, color: 'rgba(139, 92, 246, 0.12)', yOffset: 0.4 },
      { amplitude: 100, frequency: 0.0015, speed: 0.025, color: 'rgba(236, 72, 153, 0.1)', yOffset: 0.5 },
      { amplitude: 70, frequency: 0.0025, speed: 0.018, color: 'rgba(6, 182, 212, 0.08)', yOffset: 0.6 },
    ]

    // Meteor particles
    const meteors: { x: number; y: number; length: number; speed: number; opacity: number; delay: number }[] = []
    for (let i = 0; i < 8; i++) {
      meteors.push({
        x: Math.random() * width * 1.5,
        y: Math.random() * height * 0.5 - height * 0.2,
        length: Math.random() * 150 + 80,
        speed: Math.random() * 8 + 4,
        opacity: Math.random() * 0.5 + 0.3,
        delay: Math.random() * 200
      })
    }

    // Floating particles with trails
    const particles: { x: number; y: number; vx: number; vy: number; size: number; hue: number; trail: {x: number, y: number}[] }[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        hue: Math.random() * 60 + 220,
        trail: []
      })
    }

    // Glowing orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.3, radius: 300, hue: 250, pulseSpeed: 0.02 },
      { x: width * 0.8, y: height * 0.7, radius: 250, hue: 280, pulseSpeed: 0.015 },
      { x: width * 0.5, y: height * 0.2, radius: 200, hue: 200, pulseSpeed: 0.025 },
    ]

    let mouse = { x: width / 2, y: height / 2, active: false }

    function drawAuroraWaves() {
      waves.forEach((wave) => {
        ctx!.beginPath()
        ctx!.moveTo(0, height)
        
        for (let x = 0; x <= width; x += 5) {
          const y = height * wave.yOffset + 
                    Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
                    Math.sin(x * wave.frequency * 2 + time * wave.speed * 1.5) * wave.amplitude * 0.5
          ctx!.lineTo(x, y)
        }
        
        ctx!.lineTo(width, height)
        ctx!.closePath()
        
        const gradient = ctx!.createLinearGradient(0, height * wave.yOffset - wave.amplitude, 0, height)
        gradient.addColorStop(0, wave.color)
        gradient.addColorStop(1, 'transparent')
        ctx!.fillStyle = gradient
        ctx!.fill()
      })
    }

    function drawMeteors() {
      meteors.forEach(meteor => {
        if (time > meteor.delay) {
          meteor.x -= meteor.speed
          meteor.y += meteor.speed * 0.6

          if (meteor.x < -meteor.length || meteor.y > height + meteor.length) {
            meteor.x = width + Math.random() * 200
            meteor.y = Math.random() * height * 0.3 - height * 0.1
            meteor.delay = time + Math.random() * 100
          }

          const gradient = ctx!.createLinearGradient(
            meteor.x, meteor.y,
            meteor.x + meteor.length * 0.7, meteor.y - meteor.length * 0.4
          )
          gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`)
          gradient.addColorStop(0.3, `rgba(139, 92, 246, ${meteor.opacity * 0.5})`)
          gradient.addColorStop(1, 'transparent')

          ctx!.beginPath()
          ctx!.strokeStyle = gradient
          ctx!.lineWidth = 2
          ctx!.moveTo(meteor.x, meteor.y)
          ctx!.lineTo(meteor.x + meteor.length * 0.7, meteor.y - meteor.length * 0.4)
          ctx!.stroke()

          // Glow at head
          const glow = ctx!.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, 10)
          glow.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`)
          glow.addColorStop(1, 'transparent')
          ctx!.beginPath()
          ctx!.fillStyle = glow
          ctx!.arc(meteor.x, meteor.y, 10, 0, Math.PI * 2)
          ctx!.fill()
        }
      })
    }

    function drawParticles() {
      particles.forEach((p, i) => {
        // Update trail
        p.trail.unshift({ x: p.x, y: p.y })
        if (p.trail.length > 8) p.trail.pop()

        // Update position
        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Mouse interaction
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.1
            p.vx += dx / dist * force
            p.vy += dy / dist * force
          }
        }

        // Limit velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 2) {
          p.vx = (p.vx / speed) * 2
          p.vy = (p.vy / speed) * 2
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
        const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6)
        glow.addColorStop(0, `hsla(${p.hue}, 80%, 70%, 0.4)`)
        glow.addColorStop(0.5, `hsla(${p.hue}, 80%, 70%, 0.1)`)
        glow.addColorStop(1, 'transparent')
        
        ctx!.beginPath()
        ctx!.fillStyle = glow
        ctx!.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2)
        ctx!.fill()

        ctx!.beginPath()
        ctx!.fillStyle = `hsla(${p.hue}, 80%, 80%, 0.9)`
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()

        // Connect to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx!.beginPath()
            ctx!.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 70%, 60%, ${0.15 * (1 - dist / 100)})`
            ctx!.lineWidth = 0.5
            ctx!.moveTo(p.x, p.y)
            ctx!.lineTo(p2.x, p2.y)
            ctx!.stroke()
          }
        }
      })
    }

    function drawOrbs() {
      orbs.forEach((orb, i) => {
        const pulse = Math.sin(time * orb.pulseSpeed) * 0.3 + 1
        const currentRadius = orb.radius * pulse

        // Animate position slightly
        const ox = orb.x + Math.sin(time * 0.01 + i) * 30
        const oy = orb.y + Math.cos(time * 0.015 + i) * 20

        const gradient = ctx!.createRadialGradient(ox, oy, 0, ox, oy, currentRadius)
        gradient.addColorStop(0, `hsla(${orb.hue + Math.sin(time * 0.02) * 20}, 70%, 60%, 0.12)`)
        gradient.addColorStop(0.5, `hsla(${orb.hue + 20}, 60%, 50%, 0.05)`)
        gradient.addColorStop(1, 'transparent')

        ctx!.beginPath()
        ctx!.fillStyle = gradient
        ctx!.arc(ox, oy, currentRadius, 0, Math.PI * 2)
        ctx!.fill()
      })
    }

    function drawMouseGlow() {
      if (mouse.active) {
        const gradient = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120)
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)')
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)')
        gradient.addColorStop(1, 'transparent')
        
        ctx!.beginPath()
        ctx!.fillStyle = gradient
        ctx!.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2)
        ctx!.fill()

        // Inner bright core
        const core = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 20)
        core.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
        core.addColorStop(1, 'transparent')
        ctx!.beginPath()
        ctx!.fillStyle = core
        ctx!.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function animate() {
      time++
      
      // Clear with very slight opacity for trail effect
      ctx!.fillStyle = 'rgba(249, 250, 251, 0.08)'
      ctx!.fillRect(0, 0, width, height)

      drawOrbs()
      drawAuroraWaves()
      drawMeteors()
      drawParticles()
      drawMouseGlow()

      animationId = requestAnimationFrame(animate)
    }

    animate()

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
      orbs[2].y = height * 0.2
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const handleMouseLeave = () => {
      mouse.active = false
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

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none -z-20"
      />
      
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div 
        className="fixed inset-0 pointer-events-none -z-5"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.03) 100%)'
        }}
      />
    </>
  )
}
