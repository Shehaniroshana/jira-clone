import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import type { DropResult } from '@hello-pangea/dnd'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { useToast } from '@/hooks/use-toast'
import type { Issue, Sprint, CreateIssueInput } from '@/types'

const INITIAL_FORM: Partial<CreateIssueInput> = {
  title: '',
  description: '',
  type: 'task',
  priority: 'medium',
}

export function useBacklog() {
  const { projectId } = useParams<{ projectId: string }>()
  const { toast } = useToast()

  const { issues, fetchIssues, createIssue, updateIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints, createSprint, startSprint, isLoading: sprintLoading } = useSprintStore()

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSprints, setExpandedSprints] = useState<string[]>([])
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateIssueInput>>(INITIAL_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [movingIssueId, setMovingIssueId] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)

  // Initial data fetch
  useEffect(() => {
    if (!projectId) return
    fetchProject(projectId)
    fetchIssues(projectId)
    fetchSprints(projectId)
  }, [projectId, fetchProject, fetchIssues, fetchSprints])

  // Auto-expand active sprints
  useEffect(() => {
    if (sprints.length > 0) {
      setExpandedSprints(sprints.filter((s: Sprint) => s.status === 'active').map((s: Sprint) => s.id))
    }
  }, [sprints])

  const projectIssues = useMemo(
    () => (issues[projectId ?? ''] ?? []) as Issue[],
    [issues, projectId],
  )

  const filteredIssues = useMemo(() =>
    projectIssues.filter((issue) => {
      if (issue.type === 'subtask' || issue.parentIssueId) return false
      if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    }),
    [projectIssues, searchQuery],
  )

  const backlogIssues = useMemo(
    () => filteredIssues.filter((i) => !i.sprintId),
    [filteredIssues],
  )

  const getSprintIssues = (sprintId: string) =>
    filteredIssues.filter((i) => i.sprintId === sprintId)

  const calculateSprintStats = (sprintId: string) => {
    const sprintIssues = getSprintIssues(sprintId)
    const totalPoints = sprintIssues.reduce((acc, i) => acc + (i.storyPoints ?? 0), 0)
    const completedPoints = sprintIssues
      .filter((i) => i.status === 'done')
      .reduce((acc, i) => acc + (i.storyPoints ?? 0), 0)
    return { totalPoints, completedPoints, issueCount: sprintIssues.length }
  }

  const toggleSprint = (sprintId: string) =>
    setExpandedSprints((prev) =>
      prev.includes(sprintId) ? prev.filter((id) => id !== sprintId) : [...prev, sprintId],
    )

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const issue = projectIssues.find((i) => i.id === draggableId)
    if (!issue) return

    const targetSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId

    try {
      await updateIssue(issue.id, {
        title: issue.title,
        description: issue.description ?? '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        storyPoints: issue.storyPoints,
        sprintId: targetSprintId,
      })
      toast({
        title: 'Issue Moved',
        description: targetSprintId ? `${issue.key} moved to sprint` : `${issue.key} moved to backlog`,
      })
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error ?? 'Failed to move issue', variant: 'destructive' })
    }
  }

  const onMoveToBacklog = async (issue: Issue) => {
    if (movingIssueId) return
    setMovingIssueId(issue.id)
    try {
      await updateIssue(issue.id, {
        title: issue.title,
        description: issue.description ?? '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        storyPoints: issue.storyPoints,
        sprintId: null,
      })
      toast({ title: 'Issue Moved', description: `${issue.key} moved to backlog` })
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error ?? 'Failed to move issue', variant: 'destructive' })
    } finally {
      setMovingIssueId(null)
    }
  }

  const handleIssueClick = (issue: Issue, e: React.MouseEvent) => {
    if (dragStartPos) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2),
      )
      if (dist > 5) { setDragStartPos(null); return }
    }
    setSelectedIssue(issue)
    setDragStartPos(null)
  }

  const handleCreateSprint = async () => {
    if (!projectId || !newSprintName.trim()) return
    try {
      await createSprint({ projectId, name: newSprintName })
      toast({ title: 'Sprint Created', description: 'New sprint has been created' })
      setNewSprintName('')
      setShowCreateSprint(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to create sprint' })
    }
  }

  const handleStartSprint = async (sprintId: string) => {
    try {
      await startSprint(sprintId)
      toast({ title: 'Sprint Started', description: 'Sprint is now active' })
    } catch {
      toast({ title: 'Error', description: 'Failed to start sprint' })
    }
  }

  const openCreateIssueModal = () => {
    setFormData(INITIAL_FORM)
    setFormError(null)
    setShowCreateIssueModal(true)
  }

  const closeCreateIssueModal = () => setShowCreateIssueModal(false)

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
        assigneeId: formData.assigneeId,
        storyPoints: formData.storyPoints,
      })
      toast({ title: 'Issue Created', description: `New ${formData.type} created successfully!` })
      closeCreateIssueModal()
      if (projectId) fetchIssues(projectId)
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? err.message ?? 'Failed to create issue')
    }
  }

  return {
    projectId,
    currentProject,
    sprints,
    sprintLoading,
    projectIssues,
    filteredIssues,
    backlogIssues,
    getSprintIssues,
    calculateSprintStats,
    searchQuery, setSearchQuery,
    expandedSprints, toggleSprint,
    showCreateSprint, setShowCreateSprint,
    newSprintName, setNewSprintName,
    showCreateIssueModal, openCreateIssueModal, closeCreateIssueModal,
    formData, setFormData,
    formError,
    movingIssueId,
    dragStartPos, setDragStartPos,
    selectedIssue, setSelectedIssue,
    onDragEnd,
    onMoveToBacklog,
    handleIssueClick,
    handleCreateSprint,
    handleStartSprint,
    handleCreateIssue,
    fetchIssues,
  }
}
