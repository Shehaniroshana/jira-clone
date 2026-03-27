import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'
import api from '@/lib/api'
import { wsService } from '@/services/websocketService'

interface DynamicPortWrapperProps {
  children: React.ReactNode
}

export function DynamicPortWrapper({ children }: DynamicPortWrapperProps) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initElectronPort() {
      // If we are in Electron and have the IPC bridge
      if (window.electronAPI) {
        try {
          const port = await window.electronAPI.getBackendPort()
          const dynamicApiUrl = `http://127.0.0.1:${port}`
          const dynamicWsUrl = `ws://127.0.0.1:${port}/ws`

          // Update Axios baseURL dynamically
          api.defaults.baseURL = dynamicApiUrl
          
          // Update WebSocket URL dynamically
          wsService.setWsUrl(dynamicWsUrl)

          setIsReady(true)
        } catch (err) {
          console.error('Failed to get backend port from Electron', err)
          setError('Failed to connect to local backend process.')
        }
      } else {
        // Fallback for standard web browser dev environment (npm run dev)
        setIsReady(true)
      }
    }

    initElectronPort()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-6 text-center rounded-2xl border-rose-500/30 bg-rose-500/5">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Startup Error</h2>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400 tracking-wider uppercase animate-pulse">
          Starting Engine...
        </p>
      </div>
    )
  }

  return <>{children}</>
}
