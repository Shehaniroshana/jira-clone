import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion } from 'framer-motion'

interface AnalyticsChartsProps {
    stats: {
        todo: number
        inProgress: number
        done: number
        bugs: number
    }
    weeklyData: {
        name: string
        completed: number
        added: number
    }[]
}

const COLORS = {
    todo: '#94a3b8',      // slate-400
    inProgress: '#3b82f6', // blue-500
    done: '#10b981',       // emerald-500
    bugs: '#ef4444'        // red-500
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel p-2 border border-slate-700/50 shadow-xl rounded-lg">
                <p className="font-bold text-slate-200 mb-1 text-xs">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-[10px] font-medium" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export default function AnalyticsCharts({ stats, weeklyData = [] }: AnalyticsChartsProps) {
    const pieData = [
        { name: 'To Do', value: stats.todo, color: COLORS.todo },
        { name: 'In Progress', value: stats.inProgress, color: COLORS.inProgress },
        { name: 'Done', value: stats.done, color: COLORS.done },
        { name: 'Bugs', value: stats.bugs, color: COLORS.bugs },
    ].filter(d => d.value > 0)

    // Calculate total for center text
    const totalIssues = stats.todo + stats.inProgress + stats.done + stats.bugs

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Velocity Chart */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card rounded-2xl p-4 flex flex-col"
            >
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-white">Project Velocity</h3>
                        <p className="text-[10px] text-slate-400">Issues completed vs added (7d)</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Completed
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Added
                        </span>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-[250px]">
                    {weeklyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} barGap={2} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    dy={5}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }} />
                                <Bar
                                    dataKey="completed"
                                    name="Completed"
                                    fill="#06b6d4"
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={20}
                                    animationDuration={1500}
                                />
                                <Bar
                                    dataKey="added"
                                    name="Added"
                                    fill="#475569"
                                    radius={[2, 2, 0, 0]}
                                    maxBarSize={20}
                                    animationDuration={1500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                            No data available
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Status Distribution Pie Chart */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card rounded-2xl p-4 flex flex-col"
            >
                <div className="mb-2">
                    <h3 className="text-sm font-bold text-white">Issue Status</h3>
                    <p className="text-[10px] text-slate-400">Distribution by status</p>
                </div>

                <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative">
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={24}
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span className="text-slate-300 mx-1 text-[10px]">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                                <span className="text-3xl font-black text-white">
                                    {totalIssues}
                                </span>
                                <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">Total</span>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                            No issues
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
