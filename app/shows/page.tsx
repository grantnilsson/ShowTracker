"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { storage } from "@/lib/storage"
import { Show } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Star, Clock, CheckCircle2, Plus, Film, Tv2, FileVideo, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ShowsPage() {
  const [shows, setShows] = useState<Show[]>([])
  const [filteredShows, setFilteredShows] = useState<Show[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("status")

  useEffect(() => {
    const loadShows = async () => {
      const allShows = await storage.getShows()
      setShows(allShows)
      setFilteredShows(allShows)
    }
    
    loadShows()
  }, [])

  useEffect(() => {
    let filtered = shows

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(show =>
        show.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        show.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(show => show.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(show => show.watchStatus === statusFilter)
    }

    // Sort shows based on selected sort option
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          const statusOrder = {
            'watching': 0,
            'watching_on_hold': 1,
            'want_to_watch': 2,
            'completed': 3
          }
          const aOrder = statusOrder[a.watchStatus]
          const bOrder = statusOrder[b.watchStatus]
          if (aOrder !== bOrder) {
            return aOrder - bOrder
          }
          // If same status, sort by updated date
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          
        case 'name-asc':
          return a.name.localeCompare(b.name)
          
        case 'name-desc':
          return b.name.localeCompare(a.name)
          
        case 'rating-desc':
          return (b.myRating || 0) - (a.myRating || 0)
          
        case 'rating-asc':
          return (a.myRating || 0) - (b.myRating || 0)
          
        case 'year-desc':
          return b.releaseYear - a.releaseYear
          
        case 'year-asc':
          return a.releaseYear - b.releaseYear
          
        case 'updated-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          
        case 'updated-asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          
        case 'added-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          
        case 'added-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          
        default:
          return 0
      }
    })

    setFilteredShows(filtered)
  }, [shows, searchQuery, typeFilter, statusFilter])

  const getTypeIcon = (type: Show['type']) => {
    switch (type) {
      case 'movie': return <Film className="h-4 w-4" />
      case 'tv_series': return <Tv2 className="h-4 w-4" />
      case 'documentary': return <FileVideo className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: Show['watchStatus']) => {
    switch (status) {
      case 'watching':
        return <Badge variant="default" className="text-xs py-0 px-1.5">
          <Clock className="h-2.5 w-2.5" /> Watching
        </Badge>
      case 'watching_on_hold':
        return <Badge variant="warning" className="text-xs py-0 px-1.5">
          <Clock className="h-2.5 w-2.5" /> On Hold
        </Badge>
      case 'completed':
        return <Badge variant="success" className="text-xs py-0 px-1.5">
          <CheckCircle2 className="h-2.5 w-2.5" /> Completed
        </Badge>
      case 'want_to_watch':
        return <Badge variant="secondary" className="text-xs py-0 px-1.5">Want to Watch</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">All Shows</h1>
          <Button asChild>
            <Link href="/shows/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Show
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="tv_series">TV Series</SelectItem>
              <SelectItem value="documentary">Documentaries</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="watching">Watching</SelectItem>
              <SelectItem value="watching_on_hold">Watching - On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="want_to_watch">Want to Watch</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status Priority</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
              <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
              <SelectItem value="year-desc">Year (Newest)</SelectItem>
              <SelectItem value="year-asc">Year (Oldest)</SelectItem>
              <SelectItem value="updated-desc">Recently Updated</SelectItem>
              <SelectItem value="updated-asc">Least Recently Updated</SelectItem>
              <SelectItem value="added-desc">Recently Added</SelectItem>
              <SelectItem value="added-asc">Oldest Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shows Grid */}
        {filteredShows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-muted-foreground">
                {shows.length === 0 ? "No shows added yet" : "No shows match your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
            {filteredShows.map((show) => (
              <Link key={show.id} href={`/shows/${show.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full overflow-hidden">
                  <div className="flex">
                    {show.posterUrl && (
                      <img
                        src={show.posterUrl}
                        alt={show.name}
                        className="w-32 h-48 object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-base line-clamp-1">{show.name}</CardTitle>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {getTypeIcon(show.type)}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          {getStatusBadge(show.watchStatus)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {show.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{show.releaseYear}</span>
                          {show.myRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span>{show.myRating}/10</span>
                            </div>
                          )}
                        </div>
                        {show.type === 'tv_series' && show.numberOfSeasons && show.completedSeasons && (
                          <div className="text-sm text-muted-foreground mt-3">
                            Seasons: {show.completedSeasons.length}/{show.numberOfSeasons} completed
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}