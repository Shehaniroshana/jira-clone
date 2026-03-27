import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'

/**
 * Loads the current project and all projects list based on route :projectId.
 * Use this in any page that needs project context.
 */
export function useProject() {
  const { projectId } = useParams<{ projectId: string }>()

  const projects = useProjectStore((s) => s.projects)
  const currentProject = useProjectStore((s) => s.currentProject)
  const isLoading = useProjectStore((s) => s.isLoading)
  const error = useProjectStore((s) => s.error)
  const fetchProject = useProjectStore((s) => s.fetchProject)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const createProject = useProjectStore((s) => s.createProject)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const addMember = useProjectStore((s) => s.addMember)
  const removeMember = useProjectStore((s) => s.removeMember)

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId, fetchProject])

  const projectKey = useMemo(() => currentProject?.key ?? '', [currentProject])

  return {
    projectId,
    projects,
    currentProject,
    projectKey,
    isLoading,
    error,
    fetchProject,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
  }
}
