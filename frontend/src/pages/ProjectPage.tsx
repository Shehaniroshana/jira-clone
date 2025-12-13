import { useParams } from 'react-router-dom'
import { Folder } from 'lucide-react'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card rounded-2xl border border-slate-700/50 p-8 text-center">
        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-lg">
             <Folder className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Project Details</h1>
        <p className="text-slate-400 max-w-md mx-auto">
           Project ID: <span className="font-mono text-cyan-400">{projectId}</span>
        </p>
        <p className="text-slate-500 mt-4 text-sm">
          This is a placeholder page. Most project interactions happen on the Board.
        </p>
      </div>
    </div>
  )
}
