import api from '@/lib/api'

export interface SetupStatusResponse {
  configured: boolean
}

interface SaveDatabaseURLResponse {
  message: string
  restartRequired: boolean
}

export const setupService = {
  async getStatus(): Promise<SetupStatusResponse> {
    const response = await api.get<SetupStatusResponse>('/api/setup/status')
    return response.data
  },

  async saveDatabaseURL(databaseUrl: string): Promise<SaveDatabaseURLResponse> {
    const response = await api.post<SaveDatabaseURLResponse>('/api/setup/database-url', {
      databaseUrl,
    })
    return response.data
  },
}
