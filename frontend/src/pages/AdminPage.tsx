import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserPlus, Shield, ShieldCheck, ShieldAlert,
    Trash2, ToggleLeft, ToggleRight, Search,
    Mail, Calendar, MoreVertical, Check,
    UserCheck, Crown, Edit2, Key, FolderPlus
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { User, Project, CreateUserInput, UpdateUserInput, UserStats, UpdateProjectInput, CreateProjectInput } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const roleColors = {
    admin: 'from-purple-500 to-indigo-600',
    manager: 'from-blue-500 to-cyan-500',
    user: 'from-slate-500 to-slate-600',
}

const roleIcons = {
    admin: Crown,
    manager: ShieldCheck,
    user: Shield,
}

const roleBadgeColors = {
    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    user: 'bg-slate-700/50 text-slate-400 border-slate-600',
}

export default function AdminPage() {
    const { user: currentUser } = useAuthStore()
    const { toast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [projects, setProjects] = useState<Project[]>([])
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users')
    const [showCreateModal, setShowCreateModal] = useState(false)

    const [projectSearchQuery, setProjectSearchQuery] = useState('')

    // Reset Password state
    const [showResetPasswordModal, setShowResetPasswordModal] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState('')

    // Edit User state
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState<UpdateUserInput>({
        firstName: '',
        lastName: '',
        email: '',
    })

    // Create user form state
    const [newUser, setNewUser] = useState<CreateUserInput>({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user',
    })

    // Edit Project state
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [editProjectForm, setEditProjectForm] = useState<UpdateProjectInput>({
        name: '',
        key: '',
        description: '',
        ownerId: '',
    })

    // Create Project state
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
    const [newProject, setNewProject] = useState<CreateProjectInput>({
        name: '',
        key: '',
        description: '',
        ownerId: '',
    })

    // Project Stats
    const [projectStats, setProjectStats] = useState<{ totalProjects: number; totalMembers?: number } | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [usersData, statsData, projectsData, projectStatsData] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getUserStats(),
                adminService.getAllProjects(),
                adminService.getProjectStats(),
            ])
            setUsers(usersData)
            setStats(statsData)
            setProjects(projectsData)
            setProjectStats(projectStatsData)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch data',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async () => {
        try {
            const user = await adminService.createUser(newUser)
            setUsers([...users, user])
            setShowCreateModal(false)
            setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'user' })
            toast({
                title: 'Success',
                description: 'User created successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create user',
            })
        }
    }

    const handleToggleStatus = async (user: User) => {
        try {
            const result = await adminService.toggleUserStatus(user.id)
            setUsers(users.map(u => u.id === user.id ? result.user : u))
            toast({
                title: 'Success',
                description: `User ${result.isActive ? 'activated' : 'deactivated'} successfully`,
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user status',
            })
        }
    }

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            const updatedUser = await adminService.updateUserRole(userId, role)
            setUsers(users.map(u => u.id === userId ? updatedUser : u))

            toast({
                title: 'Success',
                description: 'User role updated successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user role',
            })
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            await adminService.deleteUser(userId)
            setUsers(users.filter(u => u.id !== userId))
            toast({
                title: 'Success',
                description: 'User deleted successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete user',
            })
        }
    }

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return

        try {
            await adminService.deleteProject(projectId)
            setProjects(projects.filter(p => p.id !== projectId))
            toast({
                title: 'Success',
                description: 'Project deleted successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete project',
            })
        }
    }

    const handleResetPassword = async () => {
        if (!showResetPasswordModal || !newPassword) return

        try {
            await adminService.resetUserPassword(showResetPasswordModal, newPassword)
            setShowResetPasswordModal(null)
            setNewPassword('')
            toast({
                title: 'Success',
                description: 'Password reset successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to reset password',
            })
        }
    }

    const openEditUser = (user: User) => {
        setEditingUser(user)
        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        })

    }

    const handleUpdateUser = async () => {
        if (!editingUser) return

        try {
            const updatedUser = await adminService.updateUser(editingUser.id, editForm)
            setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u))
            setEditingUser(null)
            toast({
                title: 'Success',
                description: 'User details updated successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user',
            })
        }
    }

    const handleCreateProject = async () => {
        try {
            await adminService.createProject(newProject)
            setProjects([...projects])
            setShowCreateProjectModal(false)
            setNewProject({ name: '', key: '', description: '', ownerId: '' })
            toast({
                title: 'Success',
                description: 'Project created successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create project',
            })
        }
    }

    const openEditProject = (project: Project) => {
        setEditingProject(project)
        setEditProjectForm({
            name: project.name,
            key: project.key,
            description: project.description || '',
            ownerId: project.ownerId,
        })
    }

    const handleUpdateProject = async () => {
        if (!editingProject) return

        try {
            const updatedProject = await adminService.updateProject(editingProject.id, editProjectForm)
            setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p))
            setEditingProject(null)
            toast({
                title: 'Success',
                description: 'Project updated successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update project',
            })
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = filterRole === 'all' || user.role === filterRole
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.isActive) ||
            (filterStatus === 'inactive' && !user.isActive)
        return matchesSearch && matchesRole && matchesStatus
    })

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        project.key.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        (project.owner?.firstName + ' ' + project.owner?.lastName).toLowerCase().includes(projectSearchQuery.toLowerCase())
    )

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 glass-card rounded-3xl border border-red-500/20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <ShieldAlert className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400">You need admin privileges to access this page.</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-transparent animate-fade-in pb-12">
            {/* Header */}
            <div className="sidebar-glass sticky top-0 z-20 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-500 mt-1">Manage users and system settings</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-6 border-b border-slate-800">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all border-b-2 relative ${activeTab === 'users'
                                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10'
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                        >
                            <Users className="w-4 h-4 inline-block mr-2" />
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${activeTab === 'projects'
                                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10'
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                        >
                            <FolderPlus className="w-4 h-4 inline-block mr-2" />
                            Project Management
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'users' ? (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Total Users</p>
                                            <p className="text-3xl font-bold text-white shadow-cyan-500/50">{stats.totalUsers}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* More stats cards... simplified for brevity but following same pattern */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                            <UserCheck className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Active Users</p>
                                            <p className="text-3xl font-bold text-white">{stats.activeUsers}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                            <Crown className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Admins</p>
                                            <p className="text-3xl font-bold text-white">{stats.byRole.admins}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-amber-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                            <ShieldCheck className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Managers</p>
                                            <p className="text-3xl font-bold text-white">{stats.byRole.managers}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="glass-card rounded-2xl p-4 border border-slate-700/50 mb-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-[250px]">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white focus:outline-none"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admins</option>
                                    <option value="manager">Managers</option>
                                    <option value="user">Users</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white focus:outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-neon"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add User
                                </Button>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-900/50 border-b border-slate-800">
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">User</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Email</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Role</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Status</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Joined</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="py-4 px-6"><div className="h-10 bg-slate-800 rounded-full w-48" /></td>
                                                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                                                    <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded w-20" /></td>
                                                    <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded w-16" /></td>
                                                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                                                    <td className="py-4 px-6"><div className="h-8 bg-slate-800 rounded w-8 ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="w-12 h-12 text-slate-600 mb-4" />
                                                        <p className="text-slate-500">No users found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence>
                                                {filteredUsers.map((user, index) => {
                                                    const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || Shield
                                                    return (
                                                        <motion.tr
                                                            key={user.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.02 }}
                                                            className="hover:bg-slate-800/30 transition-colors group"
                                                        >
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleColors[user.role as keyof typeof roleColors] || roleColors.user} flex items-center justify-center text-white font-semibold shadow-lg`}>
                                                                        {user.firstName[0]?.toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                                                                        {user.firstName} {user.lastName}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2 text-slate-400">
                                                                    <Mail className="w-4 h-4" />
                                                                    {user.email}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleBadgeColors[user.role as keyof typeof roleBadgeColors] || roleBadgeColors.user}`}>
                                                                    <RoleIcon className="w-3 h-3" />
                                                                    {user.role.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${user.isActive
                                                                    ? 'berald-500/20 text-emerald-400 border-emerald-500/30'
                                                                    : 'bd-500/20 text-red-400 border-red-500/30'
                                                                    }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 text-slate-500">
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-end gap-2 relative">
                                                                    {user.id !== currentUser?.id && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleToggleStatus(user)}
                                                                                className={`p-2 rounded-lg transition-colors ${user.isActive
                                                                                    ? 'h:bg-red-500/20 text-slate-500 hover:text-red-400'
                                                                                    : 'h:bg-emerald-500/20 text-slate-500 hover:text-emerald-400'
                                                                                    }`}
                                                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                                                            >
                                                                                {user.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                                            </button>

                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-cyan-500/50">
                                                                                        <MoreVertical className="w-5 h-5" />
                                                                                    </button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="w-56 glass-card border-slate-700 bg-slate-900/95 backdrop-blur-xl">
                                                                                    <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase">User Actions</DropdownMenuLabel>
                                                                                    <DropdownMenuItem onClick={() => openEditUser(user)} className="cursor-pointer">
                                                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                                                        Edit Details
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setShowResetPasswordModal(user.id)} className="cursor-pointer">
                                                                                        <Key className="w-4 h-4 mr-2" />
                                                                                        Reset Password
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuSeparator className="bg-slate-700" />
                                                                                    <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase">Change Role</DropdownMenuLabel>

                                                                                    {['admin', 'manager', 'user'].map((role) => (
                                                                                        <DropdownMenuItem
                                                                                            key={role}
                                                                                            onClick={() => handleUpdateRole(user.id, role)}
                                                                                            className={`cursor-pointer ${user.role === role ? 'text-cyan-400 bg-cyan-900/10' : 'text-slate-300'}`}
                                                                                        >
                                                                                            {role === 'admin' && <Crown className="w-4 h-4 mr-2" />}
                                                                                            {role === 'manager' && <ShieldCheck className="w-4 h-4 mr-2" />}
                                                                                            {role === 'user' && <Shield className="w-4 h-4 mr-2" />}
                                                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                                                            {user.role === role && <Check className="w-4 h-4 ml-auto" />}
                                                                                        </DropdownMenuItem>
                                                                                    ))}

                                                                                    <DropdownMenuSeparator className="bg-slate-700" />
                                                                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-300">
                                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                                        Delete User
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </>
                                                                    )}
                                                                    {user.id === currentUser?.id && (
                                                                        <span className="text-xs font-bold text-slate-600 border border-slate-700 px-2 py-1 rounded bg-slate-800">YOU</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )
                                                })}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Project Tab Content */
                    <>
                        {projectStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <FolderPlus className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Total Projects</p>
                                            <p className="text-3xl font-bold text-white">{projectStats.totalProjects}</p>
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="glass-card rounded-2xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Total Members</p>
                                            <p className="text-3xl font-bold text-white">{projectStats.totalMembers || '-'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        <div className="glass-card rounded-2xl p-4 border border-slate-700/50 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input
                                            type="text"
                                            placeholder="Search projects..."
                                            value={projectSearchQuery}
                                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                                            className="pl-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowCreateProjectModal(true)}
                                    className="btn-neon"
                                >
                                    <FolderPlus className="w-5 h-5 mr-2" />
                                    Create Project
                                </Button>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-900/50 border-b border-slate-800">
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Project Name</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Key</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Owner</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Created At</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredProjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-16 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <FolderPlus className="w-12 h-12 text-slate-600 mb-4" />
                                                        <p className="text-slate-500">No projects found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence>
                                                {filteredProjects.map((project, index) => (
                                                    <motion.tr
                                                        key={project.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.02 }}
                                                        className="hover:bg-slate-800/30 transition-colors group"
                                                    >
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                                                    {project.icon ? project.icon : project.name[0]}
                                                                </div>
                                                                <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">{project.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-400 font-mono">{project.key}</td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden ring-1 ring-slate-600">
                                                                    {project.owner?.avatar ? (
                                                                        <img src={project.owner.avatar} alt={project.owner.firstName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">
                                                                            {project.owner?.firstName?.[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-slate-300">
                                                                    {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-500 text-xs">
                                                            {new Date(project.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditProject(project)}
                                                                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteProject(project.id)}
                                                                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals placed here for Create User, Edit User, Reset Password, etc. */}
            {/* Same logic but using glass-card styles for modal content... */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">Create New User</h2>
                        <div className="space-y-4">
                            <Input placeholder="First Name" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Last Name" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                className="w-full h-10 rounded-md bg-slate-800 border border-slate-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="user">User</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 btn-neon" onClick={handleCreateUser}>Create</Button>
                                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">Reset Password</h2>
                        <div className="space-y-4">
                            <Input
                                placeholder="New Password"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="bg-slate-800 border-slate-700"
                            />
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 btn-neon" onClick={handleResetPassword}>Reset Password</Button>
                                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => {
                                    setShowResetPasswordModal(null)
                                    setNewPassword('')
                                }}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="First Name" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="bg-slate-800 border-slate-700" />
                                <Input placeholder="Last Name" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="bg-slate-800 border-slate-700" />
                            </div>
                            <Input placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 btn-neon" onClick={handleUpdateUser}>Save Changes</Button>
                                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setEditingUser(null)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {editingProject && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">Edit Project</h2>
                        <div className="space-y-4">
                            <Input placeholder="Project Name" value={editProjectForm.name} onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Project Key" value={editProjectForm.key} onChange={e => setEditProjectForm({ ...editProjectForm, key: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Description" value={editProjectForm.description} onChange={e => setEditProjectForm({ ...editProjectForm, description: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 btn-neon" onClick={handleUpdateProject}>Save Changes</Button>
                                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setEditingProject(null)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>
                        <div className="space-y-4">
                            <Input placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Project Key" value={newProject.key} onChange={e => setNewProject({ ...newProject, key: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <Input placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-slate-800 border-slate-700" />
                            <div className="flex gap-2 pt-2">
                                <Button variant="neon" className="flex-1" onClick={handleCreateProject}>Create</Button>
                                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowCreateProjectModal(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
