import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Settings, Users, Shield, Trash2, Plus, Crown,
  UserMinus, Mail, Search, Edit2, Save,
  Palette, AlertTriangle, UserPlus, FolderCog
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'
import { userService } from '@/services/userService'
import type { User } from '@/types'

const ROLES = [
  { id: 'owner', label: 'Owner', icon: Crown, color: 'text-amber-500 bg-amber-500/20', border: 'border-amber-500/30', description: 'Full access and ownership' },
  { id: 'admin', label: 'Admin', icon: Shield, color: 'text-purple-400 bg-purple-500/20', border: 'border-purple-500/30', description: 'Manage members and settings' },
  { id: 'member', label: 'Member', icon: Users, color: 'text-cyan-400 bg-cyan-500/20', border: 'border-cyan-500/30', description: 'Create and edit issues' },
  { id: 'viewer', label: 'Viewer', icon: Users, color: 'text-slate-400 bg-slate-500/20', border: 'border-slate-500/30', description: 'View only access' },
]

const PROJECT_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F97316'
]

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    currentProject,
    fetchProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
  } = useProjectStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'roles' | 'danger'>('general')
  const [isEditing, setIsEditing] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
  })

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId])

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        color: currentProject.color || '#4F46E5',
      })
    }
  }, [currentProject])

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const results = await userService.searchUsers(query)
      const currentMembers = currentProject?.members || []
      const filtered = results.filter(
        u => !currentMembers.some(m => m.userId === u.id)
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleAddMember = async (user: User, role: string = 'member') => {
    if (!currentProject) return

    try {
      await addMember(currentProject.id, user.id, role)
      setSearchQuery('')
      setSearchResults([])

      toast({
        title: 'Member Added! 👥',
        description: `${user.firstName} ${user.lastName} has been added to the project`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add member',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!currentProject) return
    if (!confirm('Remove this member from the project?')) return

    try {
      await removeMember(currentProject.id, userId)
      toast({
        title: 'Member Removed',
        description: 'The member has been removed from the project',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateRole = async (_userId: string, _newRole: string) => {
    toast({
      title: 'Not Implemented',
      description: 'Role updates are coming soon!',
    })
  }

  const handleSaveProject = async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      await updateProject(projectId, formData)
      toast({
        title: 'Project Updated! ✨',
        description: 'Your changes have been saved',
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectId) return
    if (!confirm('Are you SURE you want to delete this project? This action cannot be undone!')) return
    if (!confirm('This will delete all issues, sprints, and data. Type DELETE to confirm.')) return

    setIsLoading(true)
    try {
      await deleteProject(projectId)
      toast({
        title: 'Project Deleted',
        description: 'The project has been permanently removed',
      })
      navigate('/')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users, badge: currentProject?.members?.length || 0 },
    { id: 'roles', label: 'Roles & Access', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_15px_currentColor] transition-all"
            style={{ backgroundColor: currentProject?.color || '#4F46E5', color: currentProject?.color || '#4F46E5' }}
          >
            <div className="text-white mix-blend-overlay">
              {currentProject?.key?.substring(0, 2) || 'PR'}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Project Settings
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <FolderCog className="w-4 h-4 text-cyan-500" />
              {currentProject?.name}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${projectId}/board`)}
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          Back to Board
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="glass-card p-2 rounded-2xl border border-slate-700/50 sticky top-24">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${tab.id === 'danger' ? 'text-red-400' : ''}`} />
                      {tab.label}
                    </span>
                    {tab.badge && (
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">General Settings</h2>
                  <p className="text-sm text-slate-400">Manage your project details and appearance</p>
                </div>
                {!isEditing ? (
                  <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProject} disabled={isLoading} className="btn-neon">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-8">
                {/* Project Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Project Name</label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My Awesome Project"
                      className="bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-white">{currentProject?.name}</p>
                  )}
                </div>

                {/* Project Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Project Key</label>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-mono px-3 py-1 bg-slate-800 rounded-lg text-cyan-400 border border-slate-700">
                      {currentProject?.key}
                    </div>
                    <span className="text-sm text-slate-500">Used in issue keys (e.g., {currentProject?.key}-1)</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  {isEditing ? (
                    <textarea
                      className="flex w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder:text-slate-600"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What is this project about?"
                    />
                  ) : (
                    <p className="text-slate-400 leading-relaxed">
                      {currentProject?.description || 'No description provided'}
                    </p>
                  )}
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Project Color
                  </label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-3">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-xl transition-all hover:scale-110 shadow-lg ${formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                            : 'opacity-70 hover:opacity-100'
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow-lg"
                        style={{ backgroundColor: currentProject?.color || '#4F46E5' }}
                      />
                      <span className="text-sm font-mono text-slate-500">
                        {currentProject?.color || '#4F46E5'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Team Members</h2>
                    <p className="text-sm text-slate-400">Manage who has access to this project</p>
                  </div>
                  <Button onClick={() => setShowInviteModal(true)} className="btn-neon gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </Button>
                </div>
                <div className="p-6 space-y-3">
                  {(currentProject?.members || []).map((member, index) => {
                    // Safety check if user object exists
                    if (!member.user) return null;

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-fade-in hover:border-slate-700 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 ring-2 ring-slate-800">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                              {getInitials(member.user.firstName, member.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-white flex items-center gap-2">
                              {member.user.firstName} {member.user.lastName}
                              {member.role === 'owner' && (
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                              )}
                            </p>
                            <p className="text-sm text-slate-500">{member.user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                            disabled={member.role === 'owner'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${ROLES.find(r => r.id === member.role)?.color
                              } ${ROLES.find(r => r.id === member.role)?.border}`}
                          >
                            {ROLES.map((role) => (
                              <option key={role.id} value={role.id} className="bg-slate-900 text-white">
                                {role.label}
                              </option>
                            ))}
                          </select>

                          {member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {(!currentProject?.members || currentProject.members.length === 0) && (
                    <div className="text-center py-6 text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No members found</p>
                      <p className="text-sm">Something might be wrong with the data</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Invites */}
              <div className="glass-card rounded-2xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-800/50">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-slate-400" />
                    Pending Invitations
                  </h3>
                </div>
                <div className="p-12 text-center text-slate-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No pending invitations</p>
                  <p className="text-sm mt-1">Invite team members to collaborate via email</p>
                </div>
              </div>
            </div>
          )}

          {/* Roles & Access */}
          {activeTab === 'roles' && (
            <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-800/50">
                <h2 className="text-xl font-bold text-white">Roles & Permissions</h2>
                <p className="text-sm text-slate-400">Understand what each role can do in this project</p>
              </div>
              <div className="p-6 space-y-4">
                {ROLES.map((role) => {
                  const Icon = role.icon
                  const memberCount = (currentProject?.members || []).filter(m => m.role === role.id).length
                  return (
                    <div
                      key={role.id}
                      className="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                    >
                      <div className={`p-3 rounded-xl ${role.color.replace('text-', 'text-opacity-100 ')} bg-opacity-10`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white">
                            {role.label}
                          </h4>
                          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {role.id === 'owner' && (
                            <>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">Delete project</Badge>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">Transfer ownership</Badge>
                            </>
                          )}
                          {(role.id === 'owner' || role.id === 'admin') && (
                            <>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">Manage members</Badge>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">Edit settings</Badge>
                            </>
                          )}
                          {(role.id !== 'viewer') && (
                            <>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">Create issues</Badge>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">Comment</Badge>
                            </>
                          )}
                          <Badge variant="outline" className="border-slate-700 text-slate-400">View issues</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="glass-card rounded-2xl border border-red-500/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
              <div className="p-6 border-b border-red-500/20 relative z-10 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
                  <p className="text-sm text-red-400/70">Irreversible and destructive actions</p>
                </div>
              </div>
              <div className="p-6 space-y-6 relative z-10">
                {/* Transfer Ownership */}
                <div className="flex items-center justify-between p-4 border border-slate-700 bg-slate-900/40 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-200">Transfer Ownership</h4>
                    <p className="text-sm text-slate-500">Transfer this project to another user</p>
                  </div>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">Transfer</Button>
                </div>

                {/* Archive Project */}
                <div className="flex items-center justify-between p-4 border border-slate-700 bg-slate-900/40 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-200">Archive Project</h4>
                    <p className="text-sm text-slate-500">Make the project read-only</p>
                  </div>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">Archive</Button>
                </div>

                {/* Delete Project */}
                <div className="flex items-center justify-between p-4 border border-red-500/30 bg-red-500/10 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-red-500">Delete Project</h4>
                    <p className="text-sm text-red-400/70">Permanently delete this project and all its data</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDeleteProject}
                    className="border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md animate-scale-in shadow-2xl rounded-2xl border border-slate-700">
            <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Add Team Member</h3>
                <p className="text-sm text-slate-400">Search for users to add to your project</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Search Input */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold text-xs">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(user)}
                        className="btn-neon text-xs h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No users found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800/50">
                <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
