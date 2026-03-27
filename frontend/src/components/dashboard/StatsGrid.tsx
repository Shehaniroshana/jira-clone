import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { memo } from 'react'

interface StatsGridProps {
    stats: {
        totalProjects: number
        totalIssues: number
        myTasks: number
        completedToday: number
        inProgress: number
        todo: number
        done: number
        bugs: number
    }
}

// Mock data generator for sparklines
const generateSparklineData = (base: number, volatility: number) => {
    return Array.from({ length: 15 }, (_, i) => ({
        value: Math.max(0, base + Math.sin(i) * volatility + Math.random() * volatility)
    }))
}

const StatCard = memo(({ value, label, icon: Icon, color, trend, trendValue, delay }: any) => {
    const data = generateSparklineData(Number(value) || 10, 5)

    return (
        <motion.div
            whileHover={{ y: -3, rotateX: 2, rotateY: 2 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="glass-card relative overflow-hidden rounded-2xl p-4 group perspective-1000"
        >
            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                    <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-all duration-500 shadow-lg shadow-${color}-500/10 ring-1 ring-${color}-500/20 w-max`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-md self-start sm:self-auto`}>
                        <span className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                            {trend === 'up' ? '+' : ''}{trendValue}
                        </span>
                    </div>
                </div>

                <div>
                    <h3 className="text-3xl font-black text-white tracking-tight mb-0.5 group-hover:scale-105 transition-transform origin-left drop-shadow-lg">
                        {value}
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase opacity-80">{label}</p>
                </div>
            </div>

            {/* Sparkline Background - Adjusted for compact size */}
            <div className="absolute bottom-0 left-0 right-0 h-20 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none translate-y-4 blur-[0.5px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={`var(--color-${color}-500)`} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={`var(--color-${color}-500)`} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={`var(--color-${color}-500)`}
                            fill={`url(#gradient-${color})`}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Modern Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        </motion.div>
    )
})

export default function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Issues"
                value={stats.totalIssues}
                label="Tracked"
                icon={Activity}
                color="cyan"
                trend="up"
                trendValue="12%"
                delay={0.1}
            />
            <StatCard
                title="In Progress"
                value={stats.inProgress}
                label="Active"
                icon={Clock}
                color="purple"
                trend="up"
                trendValue="5%"
                delay={0.2}
            />
            <StatCard
                title="Completed"
                value={stats.done}
                label="Finished"
                icon={CheckCircle2}
                color="emerald"
                trend="up"
                trendValue="Today"
                delay={0.3}
            />
            <StatCard
                title="Bugs"
                value={stats.bugs}
                label="Critical"
                icon={AlertCircle}
                color="red"
                trend="down"
                trendValue="-2%"
                delay={0.4}
            />
        </div>
    )
}
