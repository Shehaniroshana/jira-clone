
import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'

interface AntigravityProps {
    count?: number
    color?: string
    particleSize?: number
    speed?: number
    opacity?: number
}

export default function Antigravity({
    count = 300,
    color = '#06b6d4',
    particleSize = 2,
    speed = 0.5,
    opacity = 0.6,
}: AntigravityProps) {
    const [init, setInit] = useState(false)

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine)
        }).then(() => {
            setInit(true)
        })
    }, [])

    const options: ISourceOptions = useMemo(
        () => ({
            background: {
                color: {
                    value: 'transparent',
                },
            },
            fpsLimit: 60,
            interactivity: {
                events: {
                    onHover: {
                        enable: true,
                        mode: 'grab',
                    },
                    resize: {
                        enable: true,
                    },
                },
                modes: {
                    grab: {
                        distance: 140,
                        links: {
                            opacity: 0.5,
                        },
                    },
                    repulse: {
                        distance: 200,
                        duration: 0.4,
                    },
                },
            },
            particles: {
                color: {
                    value: color,
                },
                links: {
                    color: color,
                    distance: 150,
                    enable: true,
                    opacity: 0.3,
                    width: 1,
                },
                move: {
                    direction: 'none',
                    enable: true,
                    outModes: {
                        default: 'bounce',
                    },
                    random: true,
                    speed: speed,
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,
                    },
                    value: count,
                },
                opacity: {
                    value: opacity,
                    animation: {
                        enable: true,
                        speed: 1,
                        minimumValue: 0.3,
                    },
                },
                shape: {
                    type: 'circle',
                },
                size: {
                    value: { min: 1, max: particleSize },
                },
            },
            detectRetina: true,
        }),
        [count, color, particleSize, speed, opacity]
    )

    if (!init) return null

    return (
        <Particles
            id="antigravity-particles"
            options={options}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
            }}
        />
    )
}
