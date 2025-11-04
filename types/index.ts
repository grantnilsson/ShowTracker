export type ShowType = 'movie' | 'documentary' | 'tv_series'

export interface Comment {
  id: string
  text: string
  createdAt: Date
}

export interface Show {
  id: string
  name: string
  description: string
  rottenTomatoesRating?: number
  releaseYear: number
  myRating?: number // 0 to 10 (allows half values like 7.5)
  comments: Comment[]
  type: ShowType
  numberOfSeasons?: number // only for TV series
  completedSeasons?: number[] // array of completed season numbers (e.g., [1, 2, 3])
  currentProgress?: {
    season?: number
    episode?: number
    timeWatched?: string // for movies/documentaries
  }
  trailerLink?: string
  posterUrl?: string
  createdAt: Date
  updatedAt: Date
  watchStatus: 'want_to_watch' | 'watching' | 'watching_on_hold' | 'completed'
}