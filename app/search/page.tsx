"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { tmdbApi, TMDBSearchResult, TMDBGenre, TMDBDetailedMovie, TMDBDetailedTV } from "@/lib/tmdb"
import { storage } from "@/lib/storage"
import { ShowType } from "@/types"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search, Film, Tv2, FileVideo, Calendar, Star, Plus, Loader2, X, Info, Clock, Globe } from "lucide-react"

export default function SearchPage() {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([])
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [movieGenres, setMovieGenres] = useState<TMDBGenre[]>([])
  const [tvGenres, setTvGenres] = useState<TMDBGenre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [previewShow, setPreviewShow] = useState<TMDBSearchResult | null>(null)
  const [previewDetails, setPreviewDetails] = useState<TMDBDetailedMovie | TMDBDetailedTV | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    showName: "",
    yearFrom: "",
    yearTo: "",
    genre: "",
    plotText: "",
    minRating: "",
    maxRating: "",
    mediaType: "all" as "all" | "movie" | "tv"
  })

  useEffect(() => {
    // Load genres on component mount
    loadGenres()
  }, [])

  const loadGenres = async () => {
    try {
      const genreData = await tmdbApi.getGenres()
      setGenres(genreData.genres)
      setMovieGenres(genreData.movieGenres)
      setTvGenres(genreData.tvGenres)
    } catch (error) {
      console.error("Error loading genres:", error)
    }
  }

  const handleSearch = async () => {
    setIsSearching(true)
    setSearchResults([])

    try {
      let results: TMDBSearchResult[] = []

      // Search by name if provided
      if (searchFilters.showName) {
        const searchResponse = searchFilters.mediaType === "all" 
          ? await tmdbApi.searchMulti(searchFilters.showName, searchFilters.yearFrom, searchFilters.yearTo)
          : searchFilters.mediaType === "movie"
          ? await tmdbApi.searchMovies(searchFilters.showName, searchFilters.yearFrom, searchFilters.yearTo)
          : await tmdbApi.searchTV(searchFilters.showName, searchFilters.yearFrom, searchFilters.yearTo)
        
        results = searchResponse.results
      }

      // Search by genre if selected
      if (selectedGenres.length > 0 && !searchFilters.showName) {
        console.log('Searching by genres:', selectedGenres, 'Media type:', searchFilters.mediaType)
        
        if (searchFilters.mediaType === "all") {
          // Search both movies and TV shows
          const [movieResults, tvResults] = await Promise.all([
            tmdbApi.discoverByGenre(selectedGenres, "movie", searchFilters.yearFrom, searchFilters.yearTo),
            tmdbApi.discoverByGenre(selectedGenres, "tv", searchFilters.yearFrom, searchFilters.yearTo)
          ])
          results = [...movieResults.results, ...tvResults.results]
        } else {
          const genreResults = await tmdbApi.discoverByGenre(
            selectedGenres, 
            searchFilters.mediaType as "movie" | "tv", 
            searchFilters.yearFrom,
            searchFilters.yearTo
          )
          console.log('Genre search returned:', genreResults.results.length, 'results')
          results = genreResults.results
        }
      }

      // Search by plot text if provided
      if (searchFilters.plotText && !searchFilters.showName) {
        const plotResults = await tmdbApi.searchByPlot(searchFilters.plotText, searchFilters.yearFrom, searchFilters.yearTo)
        results = plotResults.results
      }

      // Filter by rating if provided
      if (searchFilters.minRating || searchFilters.maxRating) {
        const min = searchFilters.minRating ? parseInt(searchFilters.minRating) : 0
        const max = searchFilters.maxRating ? parseInt(searchFilters.maxRating) : 100
        
        results = results.filter(item => {
          const rtScore = tmdbApi.convertToRottenTomatoesScore(item.vote_average)
          return rtScore >= min && rtScore <= max
        })
      }

      console.log('Search results:', results.length, 'items')
      console.log('Media types:', results.map(r => r.media_type || (r.title ? 'movie' : 'tv')))
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddShow = async (result: TMDBSearchResult) => {
    try {
      const mediaType = result.media_type || (result.title ? "movie" : "tv")
      const name = result.title || result.name || ""
      const releaseYear = result.release_date 
        ? new Date(result.release_date).getFullYear() 
        : result.first_air_date 
        ? new Date(result.first_air_date).getFullYear()
        : new Date().getFullYear()

      let numberOfSeasons: number | undefined = undefined
      
      // Get detailed info for TV shows to get number of seasons
      if (mediaType === "tv") {
        try {
          const details = await tmdbApi.getTVDetails(result.id)
          numberOfSeasons = details.number_of_seasons
        } catch (error) {
          console.error("Error fetching TV details:", error)
        }
      }

      const newShow = await storage.addShow({
        name,
        description: result.overview,
        rottenTomatoesRating: tmdbApi.convertToRottenTomatoesScore(result.vote_average),
        releaseYear,
        type: mediaType === "movie" ? "movie" : "tv_series",
        numberOfSeasons,
        watchStatus: "want_to_watch",
        comments: [],
        posterUrl: result.poster_path ? tmdbApi.getImageUrl(result.poster_path, 'w500') || undefined : undefined
      })

      router.push(`/shows/${newShow.id}/edit`)
    } catch (error) {
      console.error("Error adding show:", error)
    }
  }

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }

  const getMediaTypeIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'movie': return <Film className="h-4 w-4" />
      case 'tv': return <Tv2 className="h-4 w-4" />
      default: return <FileVideo className="h-4 w-4" />
    }
  }

  const handlePreview = async (result: TMDBSearchResult) => {
    setPreviewShow(result)
    setIsLoadingPreview(true)
    setPreviewDetails(null)

    try {
      const mediaType = result.media_type || (result.title ? "movie" : "tv")
      const details = mediaType === "movie" 
        ? await tmdbApi.getMovieDetails(result.id)
        : await tmdbApi.getTVDetails(result.id)
      
      setPreviewDetails(details)
    } catch (error) {
      console.error("Error loading preview:", error)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const closePreview = () => {
    setPreviewShow(null)
    setPreviewDetails(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchFilters({
      showName: "",
      yearFrom: "",
      yearTo: "",
      genre: "",
      plotText: "",
      minRating: "",
      maxRating: "",
      mediaType: "all"
    })
    setSelectedGenres([])
    setSearchResults([])
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Search TMDB</h1>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Filters</CardTitle>
            <CardDescription>
              Search by title, genre, plot, or rating. For genre searches (like "Science Fiction"), use the genre badges below instead of the show name field.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="showName">Title Search</Label>
                <Input
                  id="showName"
                  placeholder="Enter specific show or movie title"
                  value={searchFilters.showName}
                  onChange={(e) => setSearchFilters({ ...searchFilters, showName: e.target.value })}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Searches in show/movie titles only
                </p>
              </div>

              <div className="space-y-2">
                <Label>Release Year Range</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="yearFrom"
                    type="number"
                    placeholder="From"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    value={searchFilters.yearFrom}
                    onChange={(e) => setSearchFilters({ ...searchFilters, yearFrom: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    id="yearTo"
                    type="number"
                    placeholder="To"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    value={searchFilters.yearTo}
                    onChange={(e) => setSearchFilters({ ...searchFilters, yearTo: e.target.value })}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Genre Search</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Click genres below to search by category (e.g., Science Fiction, Comedy, Drama)
              </p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  // Show genres based on selected media type
                  const displayGenres = searchFilters.mediaType === 'movie' ? movieGenres :
                                       searchFilters.mediaType === 'tv' ? tvGenres :
                                       genres
                  
                  return displayGenres.map((genre) => (
                    <Badge
                      key={genre.id}
                      variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => toggleGenre(genre.id)}
                    >
                      {genre.name}
                      {selectedGenres.includes(genre.id) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))
                })()}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''}. Leave title field empty to search by genre only.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plotText">Plot Text (contains)</Label>
              <Input
                id="plotText"
                placeholder="Search in plot descriptions"
                value={searchFilters.plotText}
                onChange={(e) => setSearchFilters({ ...searchFilters, plotText: e.target.value })}
                onKeyPress={handleKeyPress}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minRating">Min Rating (%)</Label>
                <Input
                  id="minRating"
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={searchFilters.minRating}
                  onChange={(e) => setSearchFilters({ ...searchFilters, minRating: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRating">Max Rating (%)</Label>
                <Input
                  id="maxRating"
                  type="number"
                  placeholder="100"
                  min="0"
                  max="100"
                  value={searchFilters.maxRating}
                  onChange={(e) => setSearchFilters({ ...searchFilters, maxRating: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaType">Media Type</Label>
                <Select
                  value={searchFilters.mediaType}
                  onValueChange={(value) => {
                    setSearchFilters({ ...searchFilters, mediaType: value as any })
                    setSelectedGenres([]) // Clear genres when media type changes
                  }}
                >
                  <SelectTrigger id="mediaType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="movie">Movies Only</SelectItem>
                    <SelectItem value="tv">TV Shows Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="w-full md:w-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
              <Button 
                onClick={clearSearch}
                variant="outline"
                className="w-full md:w-auto"
                disabled={isSearching}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Search Results ({searchResults.length})</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
              {searchResults.map((result) => {
                const mediaType = result.media_type || (result.title ? "movie" : "tv")
                const name = result.title || result.name || "Unknown"
                const releaseDate = result.release_date || result.first_air_date
                const year = releaseDate ? new Date(releaseDate).getFullYear() : null
                const rtScore = tmdbApi.convertToRottenTomatoesScore(result.vote_average)
                const posterUrl = tmdbApi.getImageUrl(result.poster_path, 'w200')

                return (
                  <Card key={`${mediaType}-${result.id}`} className="overflow-hidden">
                    <div className="flex">
                      {posterUrl && (
                        <img
                          src={posterUrl}
                          alt={name}
                          className="w-32 h-48 object-cover"
                        />
                      )}
                      <div className="flex-1 p-2">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm line-clamp-1">{name}</h3>
                          <div className="flex items-center gap-2">
                            {getMediaTypeIcon(mediaType)}
                            <Badge variant="secondary" className="text-xs">
                              {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          {year && (
                            <>
                              <Calendar className="h-3 w-3" />
                              <span>{year}</span>
                            </>
                          )}
                          {result.vote_count > 0 && (
                            <>
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span>{rtScore}%</span>
                            </>
                          )}
                        </div>

                        {result.genre_ids && result.genre_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.genre_ids.slice(0, 3).map(genreId => {
                              const genre = genres.find(g => g.id === genreId)
                              return genre ? (
                                <Badge key={genreId} variant="outline" className="text-xs">
                                  {genre.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {result.overview}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(result)}
                            className="flex-1"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddShow(result)}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            Use the filters above to search for movies and TV shows
          </div>
        )}
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewShow} onOpenChange={() => closePreview()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {previewShow && (
            <>
              {isLoadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : previewDetails ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      {'title' in previewDetails ? previewDetails.title : previewDetails.name}
                    </DialogTitle>
                    <DialogDescription>
                      {('tagline' in previewDetails ? previewDetails.tagline : null) || `${previewShow.media_type === 'movie' ? 'Movie' : 'TV Show'} Details`}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Poster */}
                    <div className="md:col-span-1">
                      {previewDetails.poster_path && (
                        <img
                          src={tmdbApi.getImageUrl(previewDetails.poster_path, 'w500') || ''}
                          alt={'title' in previewDetails ? previewDetails.title : previewDetails.name}
                          className="w-full rounded-lg shadow-lg"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Ratings and Basic Info */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {'release_date' in previewDetails 
                              ? new Date(previewDetails.release_date).getFullYear()
                              : new Date(previewDetails.first_air_date).getFullYear()
                            }
                          </span>
                        </div>
                        
                        {previewDetails.vote_count > 0 && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span>{tmdbApi.convertToRottenTomatoesScore(previewDetails.vote_average)}%</span>
                            <span className="text-muted-foreground">({previewDetails.vote_count} votes)</span>
                          </div>
                        )}

                        {'runtime' in previewDetails && previewDetails.runtime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{Math.floor(previewDetails.runtime / 60)}h {previewDetails.runtime % 60}m</span>
                          </div>
                        )}

                        {'number_of_seasons' in previewDetails && (
                          <div className="flex items-center gap-2">
                            <Tv2 className="h-4 w-4" />
                            <span>{previewDetails.number_of_seasons} Seasons</span>
                          </div>
                        )}
                      </div>

                      {/* Genres */}
                      <div className="flex flex-wrap gap-2">
                        {previewDetails.genres.map(genre => (
                          <Badge key={genre.id} variant="default">
                            {genre.name}
                          </Badge>
                        ))}
                      </div>

                      {/* Overview */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Overview</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {previewDetails.overview}
                        </p>
                      </div>

                      {/* Homepage Link */}
                      {previewDetails.homepage && (
                        <div className="pt-4">
                          <a
                            href={previewDetails.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            Visit Official Website
                          </a>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-6">
                        <Button
                          onClick={() => {
                            handleAddShow(previewShow)
                            closePreview()
                          }}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to My Shows
                        </Button>
                        <Button
                          variant="outline"
                          onClick={closePreview}
                          className="flex-1"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Failed to load preview details</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}