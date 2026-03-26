import { useEffect, useRef, useCallback } from 'react'

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

    // Setup Canvas
    const resizeCvs = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      // Initial fill
      ctx.fillStyle = '#0a0e17'
      ctx.fillRect(0, 0, width, height)
    }
    resizeCvs()

    // --- CONFIGURATION ---
    const PARTICLE_COUNT = 2500 // High count for fluid look
    const BASE_SPEED = 2
    const GRID_SIZE = 40 // Resolution of the flow field
    const ZOOM = 0.005 // Noise zoom
    // ---------------------

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      history: { x: number, y: number }[]
      hue: number
      life: number
      maxLife: number

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = 0
        this.vy = 0
        this.history = []
        this.hue = Math.random() * 60 + 180 // Cyan-Blue range
        this.life = Math.random() * 100 + 50
        this.maxLife = this.life
      }

      reset() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.history = []
        this.life = Math.random() * 100 + 50
        this.maxLife = this.life
        this.hue = Math.random() > 0.5 ? 180 + Math.random() * 40 : 260 + Math.random() * 40
      }

      update(field: number[][], rows: number, cols: number) {
        // Find grid position
        const col = Math.floor(this.x / GRID_SIZE)
        const row = Math.floor(this.y / GRID_SIZE)

        let angle = 0
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          angle = field[row][col]
        }

        // Mouse interaction: swirl around mouse
        if (mouseRef.current.active) {
          const dx = this.x - mouseRef.current.x
          const dy = this.y - mouseRef.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 300) {
            const force = (300 - dist) / 300
            angle += force * 2 // Distort flow near mouse
          }
        }

        // Calculate velocity vector from angle
        const targetVx = Math.cos(angle) * BASE_SPEED
        const targetVy = Math.sin(angle) * BASE_SPEED

        // Smooth steering
        this.vx += (targetVx - this.vx) * 0.2
        this.vy += (targetVy - this.vy) * 0.2

        this.x += this.vx
        this.y += this.vy

        this.life--

        // Wrap or Reset
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.life <= 0) {
          this.reset()
        }
      }

      draw(context: CanvasRenderingContext2D) {
        // Draw just the head or a tiny trail
        context.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.life / this.maxLife})`
        context.fillRect(this.x, this.y, 1.5, 1.5)
      }
    }

    // Initialize Particles
    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle())
    }

    function draw() {
      // 1. Create Trail Effect (Fade out previous frames)
      // Adjust opacity controls trail length. Lower = longer trails.
      ctx!.fillStyle = 'rgba(10, 14, 23, 0.1)'
      ctx!.fillRect(0, 0, width, height)

      // 2. Generate Flow Field
      const rows = Math.ceil(height / GRID_SIZE)
      const cols = Math.ceil(width / GRID_SIZE)
      const field: number[][] = []

      time += 0.002 // Time step for evolution

      for (let r = 0; r < rows; r++) {
        const rowArr = []
        for (let c = 0; c < cols; c++) {
          // Generate noise angle
          // Simple flowing noise formula
          const n = Math.sin(c * ZOOM + time) + Math.cos(r * ZOOM + time) * 0.5 + Math.sin((c + r) * ZOOM * 0.5 + time)

          // Map to angle 0 -> 2PI * curve factor
          const angle = n * Math.PI * 1.5
          rowArr.push(angle)
        }
        field.push(rowArr)
      }

      // 3. Update and Draw Particles
      particles.forEach(p => {
        p.update(field, rows, cols)
        p.draw(ctx!)
      })

      // 4. Mouse Glow (Subtle)
      if (mouseRef.current.active) {
        const gradient = ctx!.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 250
        )
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.05)')
        gradient.addColorStop(1, 'transparent')
        ctx!.fillStyle = gradient
        ctx!.beginPath()
        ctx!.arc(mouseRef.current.x, mouseRef.current.y, 250, 0, Math.PI * 2)
        ctx!.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    // --- EVENT LISTENERS ---
    const handleResize = () => resizeCvs()
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
      {/* Vignette Overlay for Depth */}
      <div
        className="fixed inset-0 pointer-events-none -z-5"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 14, 23, 0.8) 90%)'
        }}
      />
    </>
  )
}
