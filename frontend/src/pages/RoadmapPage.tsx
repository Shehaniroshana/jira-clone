import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Milestone, Users } from 'lucide-react'

export default function RoadmapPage() {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()
    const { currentProject, fetchProject } = useProjectStore()

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId)
        }
    }, [projectId, fetchProject])

    // Mock Roadmap Data (since we don't have a real roadmap backend yet)
    const [tasks] = useState([
        { id: 1, name: 'Q1 Deliverables', start: 0, duration: 5, color: 'bg-cyan-500', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' },
        { id: 2, name: 'Backend Scalability', start: 2, duration: 8, color: 'bg-purple-500', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]' },
        { id: 3, name: 'UI/UX Revamp', start: 6, duration: 4, color: 'bg-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
        { id: 4, name: 'Mobile App Beta', start: 8, duration: 6, color: 'bg-amber-500', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
    ])

    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']

    return (
        <div className="min-h-screen bg-transparent animate-fade-in text-slate-200">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)} className="hover:bg-cyan-500/10 hover:text-cyan-400">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Milestone className="w-8 h-8 text-cyan-400" />
                            Strategic Roadmap
                        </h1>
                        <p className="text-slate-500 font-medium">Timeline & Milestones for {currentProject?.name}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20">
                        <Calendar className="w-4 h-4 mr-2" />
                        Export Plan
                    </Button>
                </div>
            </header>

            {/* Timeline Container */}
            <div className="glass-card p-8 rounded-3xl border border-slate-800/60 overflow-hidden relative">

                {/* Header Rows */}
                <div className="flex border-b border-slate-700/50 pb-4 mb-4">
                    <div className="w-48 shrink-0 font-bold text-slate-400 uppercase text-xs tracking-wider">Initiative</div>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                        {weeks.map((week, i) => (
                            <div key={i} className="text-center font-bold text-slate-500 uppercase text-xs tracking-wider border-l border-slate-800/50">
                                {week}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid Lines Overlay */}
                <div className="absolute inset-0 top-24 pointer-events-none flex pl-48 pr-8">
                    <div className="flex-1 grid grid-cols-4 gap-4 h-full">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="border-l border-dashed border-slate-800/40 h-full" />
                        ))}
                    </div>
                </div>

                {/* Task Rows */}
                <div className="space-y-6 relative z-10">
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-center group">
                            <div className="w-48 shrink-0 pr-4">
                                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{task.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Users className="w-3 h-3 text-slate-500" />
                                    <span className="text-xs text-slate-500">Team A</span>
                                </div>
                            </div>
                            <div className="flex-1 relative h-10 bg-slate-900/30 rounded-full overflow-hidden flex items-center px-1">
                                {/* Bar */}
                                <div
                                    className={`h-8 rounded-full ${task.color} ${task.glow} relative group-hover:brightness-110 transition-all cursor-pointer`}
                                    style={{
                                        width: `${(task.duration / 14) * 100}%`,
                                        marginLeft: `${(task.start / 14) * 100}%`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {/* Pattern */}
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Decorative Elements */}
            <div className="grid grid-cols-3 gap-6 mt-8">
                {['Strategy', 'Execution', 'Release'].map((step, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl border border-slate-800/50 flex flex-col items-center text-center hover:bg-slate-800/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center font-black text-xl text-slate-700 mb-4 border border-slate-800">
                            {i + 1}
                        </div>
                        <h3 className="font-bold text-white mb-2">{step} Phase</h3>
                        <p className="text-sm text-slate-500">Continuous integration and deployment workflow active.</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
