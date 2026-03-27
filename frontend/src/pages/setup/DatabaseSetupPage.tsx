import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, ShieldCheck, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { setupService } from '@/services/setupService'

interface DatabaseSetupPageProps {
  onConfigured: () => void
}

export default function DatabaseSetupPage({ onConfigured }: DatabaseSetupPageProps) {
  const [databaseUrl, setDatabaseUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await setupService.saveDatabaseURL(databaseUrl)
      onConfigured()
      toast({
        title: 'Database configured',
        description: response.restartRequired
          ? 'The URL is saved securely. Restart backend/app to use this database.'
          : 'Database URL saved successfully.',
      })
      navigate('/login', { replace: true })
    } catch (error: any) {
      toast({
        title: 'Configuration failed',
        description: error.response?.data?.error || 'Failed to save database URL',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Database className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Connect your PostgreSQL database</h1>
            <p className="text-slate-400 text-sm">
              This step is required before login so your workspace data goes to your own database.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="database-url" className="text-sm text-slate-300 font-medium">
              PostgreSQL URL
            </label>
            <Input
              id="database-url"
              type="text"
              placeholder="postgres://user:password@host:5432/dbname?sslmode=require"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              required
              className="h-12"
            />
            <p className="text-xs text-slate-500">
              Example: postgres://postgres:secret@localhost:5432/jira_clone?sslmode=disable
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-4 text-sm text-emerald-200 flex gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" />
            <p>
              The database URL is encrypted before being stored on this device.
            </p>
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? 'Validating connection...' : (
              <span className="flex items-center gap-2">
                Save and continue
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
