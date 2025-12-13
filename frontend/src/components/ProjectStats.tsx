import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { Project, Issue } from '@/types'

interface ProjectStatsProps {
  project: Project
  issues: Issue[]
}

export default function ProjectStats({ project, issues }: ProjectStatsProps) {
  const stats = {
    total: issues.length,
    todo: issues.filter((i) => i.status === 'todo').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    inReview: issues.filter((i) => i.status === 'in_review').length,
    done: issues.filter((i) => i.status === 'done').length,
    high: issues.filter((i) => i.priority === 'high' || i.priority === 'highest').length,
    bugs: issues.filter((i) => i.type === 'bug').length,
    stories: issues.filter((i) => i.type === 'story').length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.done}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{completionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">High: {stats.high}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm">Bugs: {stats.bugs}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Stories: {stats.stories}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Team Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{project.members?.length || 1} Members</span>
            </div>
            <Badge variant="secondary">{project.key}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
