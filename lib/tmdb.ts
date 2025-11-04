const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export interface TMDBSearchResult {
  id: number
  title?: string // for movies
  name?: string // for TV shows
  overview: string
  release_date?: string // for movies
  first_air_date?: string // for TV shows
  poster_path?: string
  backdrop_path?: string
  genre_ids: number[]
  vote_average: number
  vote_count: number
  media_type?: 'movie' | 'tv'
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBSearchResponse {
  page: number
  results: TMDBSearchResult[]
  total_pages: number
  total_results: number
}

export interface TMDBDetailedMovie {
  id: number
  title: string
  overview: string
  release_date: string
  poster_path?: string
  backdrop_path?: string
  genres: TMDBGenre[]
  vote_average: number
  vote_count: number
  runtime?: number
  tagline?: string
  homepage?: string
  imdb_id?: string
}

export interface TMDBDetailedTV {
  id: number
  name: string
  overview: string
  first_air_date: string
  poster_path?: string
  backdrop_path?: string
  genres: TMDBGenre[]
  vote_average: number
  vote_count: number
  number_of_seasons: number
  number_of_episodes: number
  homepage?: string
}

class TMDBApi {
  private getApiKey(): string {
    // Try server-side env variable first, then client-side
    const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY
    if (!apiKey) {
      throw new Error('TMDB API key not configured. Set TMDB_API_KEY or NEXT_PUBLIC_TMDB_API_KEY environment variable.')
    }
    console.log('Using TMDB API Key:', apiKey ? 'configured' : 'not configured')
    return apiKey
  }

  private async fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
    const apiKey = this.getApiKey()

    const queryParams = new URLSearchParams({
      api_key: apiKey,
      ...params
    })

    const url = `${TMDB_BASE_URL}${endpoint}?${queryParams}`
    console.log('TMDB API Request:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('TMDB API Error:', response.status, errorText)
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('TMDB API Response:', endpoint, 'returned', data.results?.length || 0, 'results', 'total_results:', data.total_results, 'page:', data.page, '/', data.total_pages)
    return data
  }

  async searchMulti(query: string, yearFrom?: string, yearTo?: string): Promise<TMDBSearchResponse> {
    const params: Record<string, string> = { query }
    
    // TMDB doesn't support year range in search, we'll need to filter results
    return this.fetchFromTMDB('/search/multi', params)
  }

  async searchMovies(query: string, yearFrom?: string, yearTo?: string): Promise<TMDBSearchResponse> {
    const params: Record<string, string> = { query }
    
    // Use release date range for movies
    if (yearFrom || yearTo) {
      if (yearFrom) {
        params['primary_release_date.gte'] = `${yearFrom}-01-01`
      }
      if (yearTo) {
        params['primary_release_date.lte'] = `${yearTo}-12-31`
      }
    }
    
    const response = await this.fetchFromTMDB('/search/movie', params)
    // Add media_type to results
    response.results = response.results.map((item: TMDBSearchResult) => ({
      ...item,
      media_type: 'movie' as const
    }))
    return response
  }

  async searchTV(query: string, yearFrom?: string, yearTo?: string): Promise<TMDBSearchResponse> {
    const params: Record<string, string> = { query }
    
    // Use first air date range for TV shows
    if (yearFrom || yearTo) {
      if (yearFrom) {
        params['first_air_date.gte'] = `${yearFrom}-01-01`
      }
      if (yearTo) {
        params['first_air_date.lte'] = `${yearTo}-12-31`
      }
    }
    
    const response = await this.fetchFromTMDB('/search/tv', params)
    // Add media_type to results
    response.results = response.results.map((item: TMDBSearchResult) => ({
      ...item,
      media_type: 'tv' as const
    }))
    return response
  }

  async getMovieDetails(id: number): Promise<TMDBDetailedMovie> {
    return this.fetchFromTMDB(`/movie/${id}`)
  }

  async getTVDetails(id: number): Promise<TMDBDetailedTV> {
    return this.fetchFromTMDB(`/tv/${id}`)
  }

  async getGenres(): Promise<{ genres: TMDBGenre[], movieGenres: TMDBGenre[], tvGenres: TMDBGenre[] }> {
    const [movieGenres, tvGenres] = await Promise.all([
      this.fetchFromTMDB('/genre/movie/list'),
      this.fetchFromTMDB('/genre/tv/list')
    ])

    // Combine and deduplicate genres
    const allGenres = [...movieGenres.genres, ...tvGenres.genres]
    const uniqueGenres = allGenres.reduce((acc: TMDBGenre[], genre) => {
      if (!acc.find(g => g.id === genre.id)) {
        acc.push(genre)
      }
      return acc
    }, [])

    return { 
      genres: uniqueGenres,
      movieGenres: movieGenres.genres,
      tvGenres: tvGenres.genres
    }
  }

  async discoverByGenre(genreIds: number[], mediaType: 'movie' | 'tv', yearFrom?: string, yearTo?: string): Promise<TMDBSearchResponse> {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv'
    
    // For TV shows, map movie genre IDs to TV genre IDs
    let mappedGenreIds = genreIds
    if (mediaType === 'tv') {
      mappedGenreIds = genreIds.map(id => {
        // Map movie Science Fiction (878) to TV Sci-Fi & Fantasy (10765)
        if (id === 878) return 10765
        return id
      })
    }
    
    const params: Record<string, string> = {
      with_genres: mappedGenreIds.join(','),
      sort_by: 'popularity.desc'
    }
    
    // Only add vote count filter for movies, as it might be too restrictive for TV
    if (mediaType === 'movie') {
      params['vote_count.gte'] = '10'
    }

    if (yearFrom || yearTo) {
      if (mediaType === 'movie') {
        if (yearFrom) {
          params['primary_release_date.gte'] = `${yearFrom}-01-01`
        }
        if (yearTo) {
          params['primary_release_date.lte'] = `${yearTo}-12-31`
        }
      } else {
        if (yearFrom) {
          params['first_air_date.gte'] = `${yearFrom}-01-01`
        }
        if (yearTo) {
          params['first_air_date.lte'] = `${yearTo}-12-31`
        }
      }
    }

    const response = await this.fetchFromTMDB(endpoint, params)
    // Add media_type to results since discover doesn't include it
    response.results = response.results.map((item: TMDBSearchResult) => ({
      ...item,
      media_type: mediaType
    }))
    
    return response
  }

  async searchByPlot(plotText: string, yearFrom?: string, yearTo?: string): Promise<TMDBSearchResponse> {
    // TMDB doesn't have direct plot search, so we'll use regular search
    // and filter results based on overview containing the plot text
    const results = await this.searchMulti(plotText, yearFrom, yearTo)
    
    // Filter results where overview contains the plot text (case insensitive)
    let filteredResults = results.results.filter(item => 
      item.overview.toLowerCase().includes(plotText.toLowerCase())
    )
    
    // Also filter by year range if provided
    if (yearFrom || yearTo) {
      filteredResults = filteredResults.filter(item => {
        const releaseDate = item.release_date || item.first_air_date
        if (!releaseDate) return true
        
        const year = new Date(releaseDate).getFullYear()
        const fromYear = yearFrom ? parseInt(yearFrom) : 0
        const toYear = yearTo ? parseInt(yearTo) : 9999
        
        return year >= fromYear && year <= toYear
      })
    }

    return {
      ...results,
      results: filteredResults,
      total_results: filteredResults.length
    }
  }

  async searchByRating(minRating: number, maxRating: number, mediaType: 'movie' | 'tv'): Promise<TMDBSearchResponse> {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv'
    
    // TMDB uses a 0-10 scale, so we need to convert from percentage
    const minVote = (minRating / 100) * 10
    const maxVote = (maxRating / 100) * 10
    
    const params: Record<string, string> = {
      'vote_average.gte': minVote.toString(),
      'vote_average.lte': maxVote.toString(),
      'vote_count.gte': '100', // Only include items with enough votes
      sort_by: 'vote_average.desc'
    }

    const response = await this.fetchFromTMDB(endpoint, params)
    // Add media_type to results
    response.results = response.results.map((item: TMDBSearchResult) => ({
      ...item,
      media_type: mediaType
    }))
    
    return response
  }

  getImageUrl(path: string | null | undefined, size: 'w200' | 'w500' | 'original' = 'w500'): string | null {
    if (!path) return null
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
  }

  // Convert TMDB vote average (0-10) to Rotten Tomatoes style percentage
  convertToRottenTomatoesScore(voteAverage: number): number {
    return Math.round(voteAverage * 10)
  }
}

export const tmdbApi = new TMDBApi()