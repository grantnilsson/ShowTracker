"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { storage } from "@/lib/storage"
import { Show } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Star, Clock, CheckCircle2, Plus, Film, Tv2, FileVideo, Search, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HomePage() {
  const [shows, setShows] = useState<Show[]>([])
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [stats, setStats] = useState({
    total: 0,
    movies: { total: 0, watching: 0, completed: 0, wantToWatch: 0 },
    tvSeries: { total: 0, watching: 0, completed: 0, wantToWatch: 0 },
    documentaries: { total: 0, watching: 0, completed: 0, wantToWatch: 0 }
  })

  useEffect(() => {
    const loadShows = async () => {
      const allShows = await storage.getShows()
      setShows(allShows)
      
      const movieStats = {
        total: allShows.filter(s => s.type === 'movie').length,
        watching: allShows.filter(s => s.type === 'movie' && s.watchStatus === 'watching').length,
        completed: allShows.filter(s => s.type === 'movie' && s.watchStatus === 'completed').length,
        wantToWatch: allShows.filter(s => s.type === 'movie' && s.watchStatus === 'want_to_watch').length
      }
      
      const tvStats = {
        total: allShows.filter(s => s.type === 'tv_series').length,
        watching: allShows.filter(s => s.type === 'tv_series' && s.watchStatus === 'watching').length,
        completed: allShows.filter(s => s.type === 'tv_series' && s.watchStatus === 'completed').length,
        wantToWatch: allShows.filter(s => s.type === 'tv_series' && s.watchStatus === 'want_to_watch').length
      }
      
      const docStats = {
        total: allShows.filter(s => s.type === 'documentary').length,
        watching: allShows.filter(s => s.type === 'documentary' && s.watchStatus === 'watching').length,
        completed: allShows.filter(s => s.type === 'documentary' && s.watchStatus === 'completed').length,
        wantToWatch: allShows.filter(s => s.type === 'documentary' && s.watchStatus === 'want_to_watch').length
      }
      
      setStats({
        total: allShows.length,
        movies: movieStats,
        tvSeries: tvStats,
        documentaries: docStats
      })
    }
    
    loadShows()
  }, [])

  const recentShows = shows
    .filter(show => typeFilter === "all" || show.type === typeFilter)
    .filter(show => {
      if (statusFilter === "all") return true
      return show.watchStatus === statusFilter
    })
    .sort((a, b) => {
      // First sort by status priority
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
    })
    .slice(0, 20)

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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => { setTypeFilter("all"); setStatusFilter("all"); }}
            className="hover:bg-accent rounded p-2 -m-2 transition-colors"
          >
            <p className="text-sm text-muted-foreground">Total Shows</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="mb-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Movies */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    <CardTitle>Movies</CardTitle>
                  </div>
                  <button
                    onClick={() => { setTypeFilter("movie"); setStatusFilter("all"); }}
                    className="hover:bg-accent rounded px-2 py-1 -my-1 transition-colors"
                  >
                    <span className="text-2xl font-bold text-primary">{stats.movies.total}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button
                      onClick={() => { setTypeFilter("movie"); setStatusFilter("watching"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Watching</p>
                      <p className="font-semibold text-primary">{stats.movies.watching}</p>
                    </button>
                    <button
                      onClick={() => { setTypeFilter("movie"); setStatusFilter("completed"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-semibold text-success">{stats.movies.completed}</p>
                    </button>
                    <button
                      onClick={() => { setTypeFilter("movie"); setStatusFilter("want_to_watch"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Want</p>
                      <p className="font-semibold">{stats.movies.wantToWatch}</p>
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* TV Series */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tv2 className="h-5 w-5" />
                    <CardTitle>TV Series</CardTitle>
                  </div>
                  <button
                    onClick={() => { setTypeFilter("tv_series"); setStatusFilter("all"); }}
                    className="hover:bg-accent rounded px-2 py-1 -my-1 transition-colors"
                  >
                    <span className="text-2xl font-bold text-primary">{stats.tvSeries.total}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button
                      onClick={() => { setTypeFilter("tv_series"); setStatusFilter("watching"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Watching</p>
                      <p className="font-semibold text-primary">{stats.tvSeries.watching}</p>
                    </button>
                    <button
                      onClick={() => { setTypeFilter("tv_series"); setStatusFilter("completed"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-semibold text-success">{stats.tvSeries.completed}</p>
                    </button>
                    <button
                      onClick={() => { setTypeFilter("tv_series"); setStatusFilter("want_to_watch"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Want</p>
                      <p className="font-semibold">{stats.tvSeries.wantToWatch}</p>
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Documentaries */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileVideo className="h-5 w-5" />
                    <CardTitle>Documentaries</CardTitle>
                  </div>
                  <button
                    onClick={() => { setTypeFilter("documentary"); setStatusFilter("all"); }}
                    className="hover:bg-accent rounded px-2 py-1 -my-1 transition-colors"
                  >
                    <span className="text-2xl font-bold text-primary">{stats.documentaries.total}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button
                      onClick={() => { setTypeFilter("documentary"); setStatusFilter("watching"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Watching</p>
                      <p className="font-semibold text-primary">{stats.documentaries.watching}</p>
                    </button>
                    <button
                      onClick={() => { setTypeFilter("documentary"); setStatusFilter("completed"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-semibold text-success">{stats.documentaries.completed}</p>
                    </button>
                    <button
                      onClick={() => { setTypeFilter("documentary"); setStatusFilter("want_to_watch"); }}
                      className="hover:bg-accent rounded p-1 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">Want</p>
                      <p className="font-semibold">{stats.documentaries.wantToWatch}</p>
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
        
        {/* Recent Shows */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[180px]">
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
              {(typeFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="px-3"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <div className="flex">
                <Button asChild className="rounded-r-none">
                  <Link href="/search">
                    <Search className="h-4 w-4 mr-2" />
                    Add Show from TMDB
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-l-none border-l-0">
                  <Link href="/shows/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {recentShows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">No shows added yet</p>
                <div className="flex justify-center">
                  <div className="flex">
                    <Button asChild className="rounded-r-none">
                      <Link href="/search">
                        <Search className="h-4 w-4 mr-2" />
                        Add Show from TMDB
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-l-none border-l-0">
                      <Link href="/shows/new">
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
              {recentShows.map((show) => (
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
        </div>
      </main>
    </div>
  )
}