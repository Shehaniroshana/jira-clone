import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Tag, Check, Sparkles } from 'lucide-react'
import { labelService } from '@/services/labelService'
import { useToast } from '@/hooks/use-toast'
import type { Label } from '@/types'

interface LabelManagerProps {
    issueId: string
    projectId: string
    selectedLabels: Label[]
    onUpdate?: () => void
}

const PREDEFINED_COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#94a3b8' },
]

export default function LabelManager({ issueId, projectId, selectedLabels, onUpdate }: LabelManagerProps) {
    const [projectLabels, setProjectLabels] = useState<Label[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [newLabelName, setNewLabelName] = useState('')
    const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[4].value)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadProjectLabels()
    }, [projectId])

    const loadProjectLabels = async () => {
        try {
            const labels = await labelService.getByProject(projectId)
            setProjectLabels(labels)
        } catch (error) {
            console.error('Failed to load labels:', error)
        }
    }

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) {
            toast({
                title: 'Label name required',
                description: 'Please enter a name for the label',
            })
            return
        }

        setIsLoading(true)
        try {
            const newLabel = await labelService.create({
                projectId,
                name: newLabelName.trim(),
                color: selectedColor,
            })

            await labelService.addToIssue(issueId, newLabel.id)

            toast({
                title: 'Label Created! ✨',
                description: `"${newLabelName}" has been added`,
            })

            setNewLabelName('')
            setIsAdding(false)
            await loadProjectLabels()
            onUpdate?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to create label',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleLabel = async (label: Label) => {
        const isSelected = selectedLabels.some((l) => l.id === label.id)

        setIsLoading(true)
        try {
            if (isSelected) {
                await labelService.removeFromIssue(issueId, label.id)
            } else {
                await labelService.addToIssue(issueId, label.id)
            }
            onUpdate?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to update label',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const isLabelSelected = (labelId: string) => {
        return selectedLabels.some((l) => l.id === labelId)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    Labels
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="h-7 px-2 text-slate-400 hover:text-purple-400 hover:bg-purple-900/20"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Selected Labels Display */}
            <div className="flex flex-wrap gap-2">
                {selectedLabels.length > 0 ? (
                    selectedLabels.map((label) => (
                        <Badge
                            key={label.id}
                            className="pl-2 pr-1 py-1 text-sm font-medium flex items-center gap-1 group cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(var(--tw-shadow-color),0.5)] border-transparent"
                            style={{
                                backgroundColor: `${label.color}20`,
                                color: label.color,
                                border: `1px solid ${label.color}40`,
                                boxShadow: `0 0 5px ${label.color}20`
                            }}
                        >
                            <span 
                                className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" 
                                style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                            <button
                                onClick={() => handleToggleLabel(label)}
                                className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))
                ) : (
                    <p className="text-sm text-slate-500 italic border border-dashed border-slate-700 px-3 py-1 rounded-full">No labels added</p>
                )}
            </div>

            {/* Label Dropdown */}
            {showDropdown && (
                <div className="glass-card rounded-xl border border-slate-700 shadow-2xl p-3 space-y-3 animate-scale-in relative z-50">
                    {/* Available Labels */}
                    {projectLabels.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">
                                Project Labels
                            </p>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                {projectLabels.map((label) => {
                                    const selected = isLabelSelected(label.id)
                                    return (
                                        <button
                                            key={label.id}
                                            onClick={() => handleToggleLabel(label)}
                                            disabled={isLoading}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                                selected
                                                    ? 'scale-105'
                                                    : 'hover:scale-105 border-transparent opacity-80 hover:opacity-100'
                                            }`}
                                            style={{
                                                backgroundColor: `${label.color}20`,
                                                color: label.color,
                                                borderColor: selected ? label.color : 'transparent',
                                                boxShadow: selected ? `0 0 8px ${label.color}30` : 'none'
                                            }}
                                        >
                                            {selected && <Check className="w-3 h-3" />}
                                            <span 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: label.color }} 
                                            />
                                            {label.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    {projectLabels.length > 0 && (
                        <div className="border-t border-slate-700/50" />
                    )}

                    {/* Create New Label Toggle */}
                    {!isAdding ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAdding(true)}
                            className="w-full justify-start text-slate-400 hover:text-purple-400 hover:bg-purple-900/10"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create New Label
                        </Button>
                    ) : (
                        <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Label Name</label>
                                <Input
                                    placeholder="e.g., Enhancement"
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                                    className="bg-slate-900 border-slate-700 text-white focus:border-purple-500"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {PREDEFINED_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
                                            className={`w-7 h-7 rounded-lg transition-all hover:scale-110 shadow-lg ${
                                                selectedColor === color.value
                                                    ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                                                    : 'opacity-70 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Preview:</span>
                                <Badge
                                    className="text-sm"
                                    style={{
                                        backgroundColor: `${selectedColor}20`,
                                        color: selectedColor,
                                        border: `1px solid ${selectedColor}40`,
                                    }}
                                >
                                    <span 
                                        className="w-2 h-2 rounded-full mr-1" 
                                        style={{ backgroundColor: selectedColor }} 
                                    />
                                    {newLabelName || 'Label name'}
                                </Badge>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCreateLabel}
                                    disabled={isLoading}
                                    size="sm"
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                >
                                    {isLoading ? 'Creating...' : 'Create'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsAdding(false)
                                        setNewLabelName('')
                                    }}
                                    className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDropdown(false)}
                        className="w-full text-slate-500 hover:text-slate-300"
                    >
                        Done
                    </Button>
                </div>
            )}
        </div>
    )
}
