import { Plus, X, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ISSUE_TYPES, PRIORITY_CONFIG } from '@/constants'
import type { CreateIssueInput } from '@/types'

interface CreateIssueModalProps {
  isOpen: boolean
  onClose: () => void
  formData: Partial<CreateIssueInput>
  onChange: (data: Partial<CreateIssueInput>) => void
  onSubmit: (e: React.FormEvent) => void
  error?: string | null
}

export function CreateIssueModal({ isOpen, onClose, formData, onChange, onSubmit, error }: CreateIssueModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-lg animate-scale-in glass-card border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 p-6">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20">
                  <Plus className="w-5 h-5 text-cyan-400" />
                </div>
                <CardTitle className="text-white">Create Issue</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-800">
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </CardHeader>
        </div>

        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Title *</label>
              <Input
                placeholder="What needs to be done?"
                value={formData.title ?? ''}
                onChange={(e) => onChange({ ...formData, title: e.target.value })}
                required
                className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <textarea
                placeholder="Add details..."
                value={formData.description ?? ''}
                onChange={(e) => onChange({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <Select
                  value={formData.type ?? 'task'}
                  onValueChange={(value) => onChange({ ...formData, type: value as any })}
                >
                  <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" style={{ color: type.color }} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Priority</label>
                <Select
                  value={formData.priority ?? 'medium'}
                  onValueChange={(value) => onChange({ ...formData, priority: value as any })}
                >
                  <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-white focus:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Story Points</label>
              <Input
                type="number"
                placeholder="Estimate effort"
                value={formData.storyPoints ?? ''}
                onChange={(e) => onChange({ ...formData, storyPoints: parseInt(e.target.value) || 0 })}
                className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 btn-neon">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Issue
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </div>
    </div>
  )
}
