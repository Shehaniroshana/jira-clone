import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { DropResult } from '@hello-pangea/dnd'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { useToast } from '@/hooks/use-toast'
import type { Issue, CreateIssueInput } from '@/types'
import { STATUS_CONFIG, type BoardStatus } from '@/constants/board'

const INITIAL_FORM: Partial<CreateIssueInput> = {
  title: '',
  description: '',
  type: 'task',
  priority: 'medium',
}

export function useBoard() {
  const { projectId } = useParams<{ projectId: string }>()
  const { toast } = useToast()

  const { issues, fetchIssues, updateIssue, createIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints } = useSprintStore()

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'mine'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreateIssueInput>>(INITIAL_FORM)

  // Fetch all data on mount
  useEffect(() => {
    if (!projectId) return
    Promise.all([
      fetchProject(projectId),
      fetchIssues(projectId),
      fetchSprints(projectId),
    ]).finally(() => setIsLoading(false))
  }, [projectId, fetchProject, fetchIssues, fetchSprints])

  const activeSprint = useMemo(() => sprints.find((s) => s.status === 'active'), [sprints])

  const boardIssues = useMemo(
    () => (issues[projectId ?? ''] ?? []) as Issue[],
    [issues, projectId],
  )

  const sprintIssues = useMemo(() => {
    if (!activeSprint) return []
    return boardIssues.filter((i) => {
      if (i.sprintId !== activeSprint.id) return false
      if (searchQuery && !i.title.toLowerCase().includes(searchQuery.toLowerCase()) && !i.key.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [boardIssues, activeSprint, searchQuery])

  const columns = useMemo(() => ({
    todo: sprintIssues.filter((i) => i.status === 'todo' && i.type !== 'subtask'),
    in_progress: sprintIssues.filter((i) => i.status === 'in_progress' && i.type !== 'subtask'),
    in_review: sprintIssues.filter((i) => i.status === 'in_review' && i.type !== 'subtask'),
    done: sprintIssues.filter((i) => i.status === 'done' && i.type !== 'subtask'),
  }), [sprintIssues])

  const stats = useMemo(() => {
    const total = sprintIssues.filter((i) => i.type !== 'subtask').length
    const totalPoints = sprintIssues.reduce((acc, i) => acc + (i.storyPoints ?? 0), 0)
    const completedPoints = columns.done.reduce((acc, i) => acc + (i.storyPoints ?? 0), 0)
    const progress = total > 0 ? Math.round((columns.done.length / total) * 100) : 0
    return { total, totalPoints, completedPoints, progress, inProgress: columns.in_progress.length, done: columns.done.length }
  }, [sprintIssues, columns])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const issue = boardIssues.find((i) => i.id === draggableId)
    if (!issue) return

    const newStatus = destination.droppableId as BoardStatus
    try {
      await updateIssue(issue.id, { ...issue, status: newStatus })
      toast({ title: 'Issue Updated', description: `Moved to ${STATUS_CONFIG[newStatus].label}` })
    } catch {
      toast({ title: 'Error', description: 'Failed to update issue status', variant: 'destructive' })
    }
  }

  const openCreateModal = () => {
    setFormData(INITIAL_FORM)
    setFormError(null)
    setShowCreateModal(true)
  }

  const closeCreateModal = () => setShowCreateModal(false)

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!projectId || !currentProject) { setFormError('Project not found'); return }
    if (!formData.title?.trim()) { setFormError('Title is required'); return }

    try {
      await createIssue({
        projectId,
        projectKey: currentProject.key,
        title: formData.title!,
        description: formData.description ?? '',
        type: formData.type ?? 'task',
        priority: formData.priority ?? 'medium',
        sprintId: activeSprint?.id,
        assigneeId: formData.assigneeId,
        storyPoints: formData.storyPoints,
      })
      toast({ title: 'Issue Created', description: `New ${formData.type} added to the sprint!` })
      closeCreateModal()
      if (projectId) fetchIssues(projectId)
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? err.message ?? 'Failed to create issue')
    }
  }

  const toggleUserFilter = () => setUserFilter((prev) => (prev === 'mine' ? 'all' : 'mine'))
  const clearFilters = () => { setSearchQuery(''); setUserFilter('all') }
  const hasActiveFilters = searchQuery !== '' || userFilter !== 'all'

  return {
    projectId,
    currentProject,
    activeSprint,
    isLoading,
    boardIssues,
    columns,
    stats,
    searchQuery, setSearchQuery,
    userFilter, toggleUserFilter,
    hasActiveFilters, clearFilters,
    selectedIssue, setSelectedIssue,
    showCreateModal, openCreateModal, closeCreateModal,
    formData, setFormData,
    formError,
    handleDragEnd,
    handleCreateIssue,
    fetchIssues,
  }
}
