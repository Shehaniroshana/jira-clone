import { useState, useEffect } from 'react'
import { Link2, Trash2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { issueLinkService, IssueLink } from '@/services/issueLinkService'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface LinkedIssuesSectionProps {
  issueId: string
  projectId: string
}

const LINK_TYPES = [
  { id: 'blocks', label: 'Blocks', inverse: 'is blocked by' },
  { id: 'is_blocked_by', label: 'Is blocked by', inverse: 'blocks' },
  { id: 'relates_to', label: 'Relates to', inverse: 'relates to' },
  { id: 'duplicates', label: 'Duplicates', inverse: 'is duplicated by' },
]

export default function LinkedIssuesSection({ issueId, projectId }: LinkedIssuesSectionProps) {
  const { toast } = useToast()
  const [links, setLinks] = useState<IssueLink[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projectIssues, setProjectIssues] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState('relates_to')
  const [selectedTargetId, setSelectedTargetId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLinks()
  }, [issueId])

  const fetchLinks = async () => {
    try {
      const data = await issueLinkService.getByIssue(issueId)
      setLinks(data)
    } catch (error) {
      console.error('Failed to fetch links', error)
    }
  }

  const fetchProjectIssues = async () => {
    if (projectIssues.length > 0) return
    try {
      if (!projectId) {
        console.warn("ProjectId is required to fetch project issues")
        return
      }
      const res = await api.get(`/api/issues/project/${projectId}`)
      setProjectIssues(res.data)
    } catch (error) {
      console.error('Failed to fetch project issues', error)
      toast({ title: 'Error', description: 'Could not load issues for linking' })
    }
  }

  const handleStartAdd = () => {
    setIsAdding(true)
    fetchProjectIssues()
  }

  const handleAddLink = async () => {
    if (!selectedTargetId) return

    setLoading(true)
    try {
      await issueLinkService.create({
        sourceId: issueId,
        targetId: selectedTargetId,
        type: selectedType
      })
      await fetchLinks()
      setIsAdding(false)
      setSelectedTargetId('')
      toast({ title: 'Link created', description: 'Issue linked successfully' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to link issue'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await issueLinkService.delete(linkId)
      setLinks(links.filter(l => l.id !== linkId))
      toast({ title: 'Link removed', description: 'Issue link deleted' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete link' })
    }
  }

  const getLinkText = (link: IssueLink) => {
    const isSource = link.sourceId === issueId
    const typeDef = LINK_TYPES.find(t => t.id === link.type)
    if (!typeDef) return link.type
    return isSource ? typeDef.label : (typeDef.inverse || typeDef.label)
  }

  const getLinkedIssue = (link: IssueLink) => {
    return link.sourceId === issueId ? link.target : link.source
  }

  const filteredIssues = projectIssues.filter(i =>
    i.id !== issueId &&
    (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.key.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5" />
          Linked Issues
        </label>
        {!isAdding && (
          <Button variant="ghost" size="sm" onClick={handleStartAdd} className="h-6 w-6 p-0 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="glass-card rounded-xl p-3 space-y-3 border border-slate-700 animate-in slide-in-from-top-2">
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 text-xs w-[110px] bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {LINK_TYPES.map(t => (
                  <SelectItem key={t.id} value={t.id} className="focus:bg-slate-800 focus:text-white">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Search className="w-3 h-3 absolute left-2 top-2.5 text-slate-500" />
              <input
                className="w-full h-8 pl-7 pr-2 rounded-md border border-slate-700 text-xs bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {searchQuery && (
            <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-900 rounded-md border border-slate-700 p-1 custom-scrollbar">
              {filteredIssues.map(issue => (
                <div
                  key={issue.id}
                  className={`text-xs p-2 rounded cursor-pointer flex items-center gap-2 ${selectedTargetId === issue.id ? 'bg-cyan-900/40 text-cyan-400' : 'hover:bg-slate-800 text-slate-300'}`}
                  onClick={() => setSelectedTargetId(issue.id)}
                >
                  <span className="font-mono font-semibold text-slate-500">{issue.key}</span>
                  <span className="truncate flex-1">{issue.title}</span>
                </div>
              ))}
              {filteredIssues.length === 0 && (
                <div className="p-2 text-xs text-slate-500 text-center">No issues found</div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddLink} disabled={!selectedTargetId || loading} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white border-0 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              Link Issue
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {links.length === 0 && !isAdding && (
          <div className="text-xs text-slate-600 italic py-2 border border-dashed border-slate-800 rounded-lg px-3">No linked issues</div>
        )}

        {links.map(link => {
          const linkedIssue = getLinkedIssue(link)
          if (!linkedIssue) return null

          return (
            <div key={link.id} className="group flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-slate-700/50 p-1.5 rounded-md text-slate-400">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                    {getLinkText(link)}
                  </span>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300 truncate">
                    <span className="text-cyan-400 font-mono text-xs">{linkedIssue.key}</span>
                    <span className="truncate text-white">{linkedIssue.title}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteLink(link.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
