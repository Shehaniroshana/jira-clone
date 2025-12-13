import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
    children: ReactNode
    className?: string
    delay?: number
}

export const AnimatedCard = ({ children, className = '', delay = 0 }: AnimatedCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{
                y: -8,
                transition: { duration: 0.3 }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface AnimatedButtonProps {
    children: ReactNode
    className?: string
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
}

export const AnimatedButton = ({ children, className = '', onClick, type = 'button' }: AnimatedButtonProps) => {
    return (
        <motion.button
            type={type}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className={className}
        >
            {children}
        </motion.button>
    )
}

interface AnimatedListItemProps {
    children: ReactNode
    className?: string
    index?: number
}

export const AnimatedListItem = ({ children, className = '', index = 0 }: AnimatedListItemProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ x: 4 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface FadeInProps {
    children: ReactNode
    className?: string
    delay?: number
}

export const FadeIn = ({ children, className = '', delay = 0 }: FadeInProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface ScaleInProps {
    children: ReactNode
    className?: string
    delay?: number
}

export const ScaleIn = ({ children, className = '', delay = 0 }: ScaleInProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface SlideInProps {
    children: ReactNode
    className?: string
    direction?: 'left' | 'right' | 'up' | 'down'
    delay?: number
}

export const SlideIn = ({ children, className = '', direction = 'up', delay = 0 }: SlideInProps) => {
    const directions = {
        left: { x: -50, y: 0 },
        right: { x: 50, y: 0 },
        up: { x: 0, y: 20 },
        down: { x: 0, y: -20 },
    }

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...directions[direction] }}
            transition={{ duration: 0.5, delay }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface AnimatedIconProps {
    children: ReactNode
    className?: string
}

export const AnimatedIcon = ({ children, className = '' }: AnimatedIconProps) => {
    return (
        <motion.div
            whileHover={{
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 }
            }}
            whileTap={{ scale: 0.9 }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

interface StaggerContainerProps {
    children: ReactNode
    className?: string
}

export const StaggerContainer = ({ children, className = '' }: StaggerContainerProps) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export const StaggerItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
