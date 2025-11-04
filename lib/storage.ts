import { Show } from '@/types'

const STORAGE_KEY = 'myshows_data'

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

export const storage = {
  // Get all shows from database
  getShows: async (): Promise<Show[]> => {
    try {
      const response = await fetch('/api/shows')
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching shows:', error)
      // Fallback to localStorage for offline support
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
      }
      return []
    }
  },

  // Save shows to localStorage (for backup/offline)
  saveShowsLocally: (shows: Show[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shows))
  },

  // Get single show from database
  getShow: async (id: string): Promise<Show | undefined> => {
    try {
      const response = await fetch(`/api/shows/${id}`)
      if (response.status === 404) return undefined
      return handleResponse(response)
    } catch (error) {
      console.error('Error fetching show:', error)
      // Fallback to localStorage
      const shows = await storage.getShows()
      return shows.find(show => show.id === id)
    }
  },

  // Add new show to database
  addShow: async (show: Omit<Show, 'id' | 'createdAt' | 'updatedAt'>): Promise<Show> => {
    console.log('Adding show to database:', show.name)
    try {
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(show)
      })
      const newShow = await handleResponse(response)
      console.log('Show added to database with ID:', newShow.id)
      
      // Update local storage backup
      const shows = await storage.getShows()
      storage.saveShowsLocally(shows)
      
      return newShow
    } catch (error) {
      console.error('Error adding show to database, falling back to localStorage:', error)
      // Fallback to localStorage
      const shows = await storage.getShows()
      const newShow: Show = {
        ...show,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: []
      }
      shows.push(newShow)
      storage.saveShowsLocally(shows)
      console.log('Show added to localStorage with ID:', newShow.id)
      return newShow
    }
  },

  // Update show in database
  updateShow: async (id: string, updates: Partial<Show>): Promise<Show | undefined> => {
    try {
      const response = await fetch(`/api/shows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const updatedShow = await handleResponse(response)
      
      // Update local storage backup
      const shows = await storage.getShows()
      storage.saveShowsLocally(shows)
      
      return updatedShow
    } catch (error) {
      console.error('Error updating show:', error)
      // Fallback to localStorage
      const shows = await storage.getShows()
      const index = shows.findIndex(show => show.id === id)
      if (index === -1) return undefined
      
      shows[index] = {
        ...shows[index],
        ...updates,
        updatedAt: new Date()
      }
      storage.saveShowsLocally(shows)
      return shows[index]
    }
  },

  // Delete show from database
  deleteShow: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/shows/${id}`, {
        method: 'DELETE'
      })
      await handleResponse(response)
      
      // Update local storage backup
      const shows = await storage.getShows()
      storage.saveShowsLocally(shows.filter(show => show.id !== id))
      
      return true
    } catch (error) {
      console.error('Error deleting show:', error)
      // Fallback to localStorage
      const shows = await storage.getShows()
      const filteredShows = shows.filter(show => show.id !== id)
      if (filteredShows.length === shows.length) return false
      
      storage.saveShowsLocally(filteredShows)
      return true
    }
  },

  // Add comment to show
  addComment: async (showId: string, text: string): Promise<Show | undefined> => {
    try {
      const response = await fetch(`/api/shows/${showId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const updatedShow = await handleResponse(response)
      
      // Update local storage backup
      const shows = await storage.getShows()
      storage.saveShowsLocally(shows)
      
      return updatedShow
    } catch (error) {
      console.error('Error adding comment:', error)
      // Fallback to localStorage
      const show = await storage.getShow(showId)
      if (!show) return undefined
      
      const newComment = {
        id: crypto.randomUUID(),
        text,
        createdAt: new Date()
      }
      
      return storage.updateShow(showId, {
        comments: [...show.comments, newComment]
      })
    }
  },

  // Migrate data from localStorage to database
  migrateToDatabase: async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false
      
      const localData = localStorage.getItem(STORAGE_KEY)
      if (!localData) return false
      
      const shows = JSON.parse(localData)
      if (!shows || shows.length === 0) return false
      
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shows })
      })
      
      const result = await handleResponse(response)
      console.log('Migration result:', result)
      
      return result.success
    } catch (error) {
      console.error('Error migrating to database:', error)
      return false
    }
  }
}