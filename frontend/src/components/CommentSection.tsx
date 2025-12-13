import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { commentService } from '@/services/commentService'
import type { Comment, CreateCommentInput } from '@/types'

interface CommentSectionProps {
  issueId: string
  comments: Comment[]
  onCommentAdded: () => void
}

export default function CommentSection({ issueId, comments, onCommentAdded }: CommentSectionProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredComment, setHoveredComment] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const commentData: CreateCommentInput = {
        issueId,
        content: newComment,
      }
      await commentService.create(commentData)
      setNewComment('')
      onCommentAdded()
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted!',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return

    try {
      await commentService.delete(commentId)
      onCommentAdded()
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been removed',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
      })
    }
  }

  const getRandomGradient = (userId: string) => {
    const gradients = [
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-cyan-500 to-blue-500',
    ]
    const index = userId.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <MessageSquare className="w-5 h-5 text-cyan-500" />
          Comments
          <span className="text-sm font-normal text-slate-500">
            ({comments.length})
          </span>
        </h3>
      </div>

      {/* Add Comment Form - Top */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-slate-800">
            <AvatarFallback className={`bg-gradient-to-br ${user ? getRandomGradient(user.id) : 'from-slate-600 to-slate-700'} text-white font-bold`}>
              {user ? getInitials(user.firstName, user.lastName) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="relative">
              <textarea
                className="flex w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-white ring-offset-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus:border-cyan-500 resize-none transition-all shadow-inner"
                placeholder="Add a comment... (Markdown supported)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="absolute bottom-2 right-2">
                 {/* Optional formatting toolbar could go here */}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500">
                Pro tip: Use **bold** and *italic* for formatting
              </p>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmitting || !newComment.trim()}
                className="gap-2 btn-neon"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Divider */}
      {comments.length > 0 && (
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-slate-900/50 backdrop-blur-sm rounded-full text-xs font-medium text-slate-500 border border-slate-800">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No comments yet</p>
            <p className="text-sm text-slate-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <div 
              key={comment.id}
              className="group relative animate-slide-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onMouseEnter={() => setHoveredComment(comment.id)}
              onMouseLeave={() => setHoveredComment(null)}
            >
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-slate-800 mt-1">
                  <AvatarFallback className={`bg-gradient-to-br ${comment.userId ? getRandomGradient(comment.userId) : 'from-slate-600 to-slate-700'} text-white text-xs font-bold`}>
                    {comment.user ? getInitials(comment.user.firstName, comment.user.lastName) : '??'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl rounded-tl-none p-4 relative hover:bg-slate-800/60 transition-colors group-hover:border-slate-600/50">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-400 text-sm">
                          {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
                        </span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      
                      {/* Actions - visible on hover */}
                      <div className={`flex items-center gap-1 transition-opacity ${
                        hoveredComment === comment.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        {user?.id === comment.userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(comment.id)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
