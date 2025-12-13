import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const isClickable =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('[role="button"]') ||
                target.classList.contains('cursor-pointer')

            setIsHovering(!!isClickable)
        }

        window.addEventListener('mousemove', updateMousePosition)
        window.addEventListener('mouseover', handleMouseOver)

        return () => {
            window.removeEventListener('mousemove', updateMousePosition)
            window.removeEventListener('mouseover', handleMouseOver)
        }
    }, [])

    return (
        <>
            {/* Main cursor dot */}
            <motion.div
                className="fixed top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full pointer-events-none z-[9999] mix-blend-screen"
                style={{
                    x: mousePosition.x - 6,
                    y: mousePosition.y - 6,
                }}
                animate={{
                    scale: isHovering ? 1.5 : 1,
                    opacity: isHovering ? 0.8 : 1,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            />

            {/* Outer ring */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 border-2 border-cyan-400/30 rounded-full pointer-events-none z-[9998] mix-blend-screen"
                style={{
                    x: mousePosition.x - 16,
                    y: mousePosition.y - 16,
                }}
                animate={{
                    scale: isHovering ? 1.5 : 1,
                }}
                transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
            />

            {/* Glow effect */}
            <motion.div
                className="fixed top-0 left-0 w-16 h-16 bg-cyan-500/10 rounded-full pointer-events-none z-[9997] blur-xl"
                style={{
                    x: mousePosition.x - 32,
                    y: mousePosition.y - 32,
                }}
                animate={{
                    scale: isHovering ? 1.2 : 1,
                    opacity: isHovering ? 0.6 : 0.3,
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
        </>
    )
}
