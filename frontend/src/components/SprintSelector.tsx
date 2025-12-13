import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Play, CheckCircle, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Sprint } from '@/types'

interface SprintSelectorProps {
  sprints: Sprint[]
  currentSprint: Sprint | null
  onSprintChange: (sprint: Sprint | null) => void
}

export default function SprintSelector({ sprints, currentSprint, onSprintChange }: SprintSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeSprint = sprints.find((s) => s.status === 'active')
  const plannedSprints = sprints.filter((s) => s.status === 'planned')
  const completedSprints = sprints.filter((s) => s.status === 'completed')

  const getSprintIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />
    }
  }

  const getSprintBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="text-xs bg-blue-100 text-blue-700">Active</Badge>
      case 'completed':
        return <Badge className="text-xs bg-green-100 text-green-700">Completed</Badge>
      default:
        return <Badge className="text-xs bg-gray-100 text-gray-700">Planned</Badge>
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{currentSprint ? currentSprint.name : 'All Issues'}</span>
          {currentSprint && getSprintBadge(currentSprint.status)}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* All Issues Option */}
            <div
              className={`p-3 hover:bg-gray-50 cursor-pointer border-b ${!currentSprint ? 'bg-blue-50' : ''}`}
              onClick={() => {
                onSprintChange(null)
                setIsOpen(false)
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">All Issues</span>
                <Badge variant="secondary" className="text-xs">
                  {sprints.length} Sprints
                </Badge>
              </div>
            </div>

            {/* Active Sprint */}
            {activeSprint && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  Active Sprint
                </div>
                <div
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${currentSprint?.id === activeSprint.id ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    onSprintChange(activeSprint)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getSprintIcon(activeSprint.status)}
                      <div>
                        <p className="font-medium">{activeSprint.name}</p>
                        {activeSprint.goal && (
                          <p className="text-xs text-gray-600 mt-1">{activeSprint.goal}</p>
                        )}
                        {activeSprint.startDate && activeSprint.endDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activeSprint.startDate)} - {formatDate(activeSprint.endDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    {getSprintBadge(activeSprint.status)}
                  </div>
                </div>
              </div>
            )}

            {/* Planned Sprints */}
            {plannedSprints.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  Planned Sprints
                </div>
                {plannedSprints.map((sprint) => (
                  <div
                    key={sprint.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${currentSprint?.id === sprint.id ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      onSprintChange(sprint)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {getSprintIcon(sprint.status)}
                        <div>
                          <p className="font-medium">{sprint.name}</p>
                          {sprint.goal && (
                            <p className="text-xs text-gray-600 mt-1">{sprint.goal}</p>
                          )}
                        </div>
                      </div>
                      {getSprintBadge(sprint.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Sprints */}
            {completedSprints.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  Completed Sprints
                </div>
                {completedSprints.slice(0, 5).map((sprint) => (
                  <div
                    key={sprint.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${currentSprint?.id === sprint.id ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      onSprintChange(sprint)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {getSprintIcon(sprint.status)}
                        <p className="font-medium text-sm">{sprint.name}</p>
                      </div>
                      {getSprintBadge(sprint.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
