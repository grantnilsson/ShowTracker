"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { Show } from "@/types"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Edit, Trash2, Star, Clock, CheckCircle2, Film, Tv2, FileVideo, ExternalLink, Plus, MessageSquare, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [show, setShow] = useState<Show | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [progress, setProgress] = useState({
    season: "",
    episode: "",
    timeWatched: ""
  })
  const [completedSeasons, setCompletedSeasons] = useState<number[]>([])
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [newSeasonAvailable, setNewSeasonAvailable] = useState(false)
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false)

  useEffect(() => {
    const loadShow = async () => {
      const foundShow = await storage.getShow(id)
      if (!foundShow) {
        router.push("/shows")
        return
      }
      setShow(foundShow)
      if (foundShow.currentProgress) {
        setProgress({
          season: foundShow.currentProgress.season?.toString() || "",
          episode: foundShow.currentProgress.episode?.toString() || "",
          timeWatched: foundShow.currentProgress.timeWatched || ""
        })
      }
      if (foundShow.completedSeasons) {
        setCompletedSeasons(foundShow.completedSeasons)
      }
    }
    
    loadShow()
  }, [id, router])

  const handleWatchStatusChange = async (newStatus: string) => {
    if (!show) return
    
    const updated = await storage.updateShow(id, { watchStatus: newStatus })
    if (updated) {
      setShow(updated)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this show?")) {
      await storage.deleteShow(id)
      router.push("/shows")
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    const updatedShow = await storage.addComment(id, newComment)
    if (updatedShow) {
      setShow(updatedShow)
      setNewComment("")
      setIsAddingComment(false)
    }
  }

  const handleUpdateProgress = async () => {
    const updatedShow = await storage.updateShow(id, {
      currentProgress: {
        season: progress.season ? Number(progress.season) : undefined,
        episode: progress.episode ? Number(progress.episode) : undefined,
        timeWatched: progress.timeWatched || undefined
      }
    })
    if (updatedShow) {
      setShow(updatedShow)
    }
  }

  const handleUpdateRating = async (rating: number) => {
    const updatedShow = await storage.updateShow(id, { myRating: rating })
    if (updatedShow) {
      setShow(updatedShow)
    }
  }

  const toggleCompletedSeason = async (seasonNumber: number) => {
    const newCompletedSeasons = completedSeasons.includes(seasonNumber)
      ? completedSeasons.filter(s => s !== seasonNumber)
      : [...completedSeasons, seasonNumber].sort((a, b) => a - b)
    
    setCompletedSeasons(newCompletedSeasons)
    const updatedShow = await storage.updateShow(id, { completedSeasons: newCompletedSeasons })
    if (updatedShow) {
      setShow(updatedShow)
    }
  }

  const checkForTMDBUpdate = async () => {
    if (!show || show.type !== 'tv_series') return
    
    setIsCheckingUpdate(true)
    setNewSeasonAvailable(false)
    
    try {
      // Search for the show on TMDB
      const { tmdbApi } = await import('@/lib/tmdb')
      const searchResults = await tmdbApi.searchTV(show.name, show.releaseYear.toString(), show.releaseYear.toString())
      
      if (searchResults.results.length > 0) {
        // Get the first matching result
        const tmdbShow = searchResults.results[0]
        const details = await tmdbApi.getTVDetails(tmdbShow.id)
        
        // Check if there are more seasons on TMDB
        if (details.number_of_seasons > (show.numberOfSeasons || 0)) {
          setNewSeasonAvailable(true)
          
          // Update the show with new season count
          const updatedShow = await storage.updateShow(id, { 
            numberOfSeasons: details.number_of_seasons 
          })
          
          if (updatedShow) {
            setShow(updatedShow)
          }
        }
      }
    } catch (error) {
      console.error('Error checking TMDB update:', error)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  if (!show) return null

  const getTypeIcon = (type: Show['type']) => {
    switch (type) {
      case 'movie': return <Film className="h-5 w-5" />
      case 'tv_series': return <Tv2 className="h-5 w-5" />
      case 'documentary': return <FileVideo className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: Show['watchStatus']) => {
    switch (status) {
      case 'watching':
        return <Badge variant="default" className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Watching
        </Badge>
      case 'completed':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </Badge>
      case 'want_to_watch':
        return <Badge variant="secondary">Want to Watch</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6">
        <Link href="/shows" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shows
        </Link>

        <div className="space-y-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader className="p-4">
              <div className="flex gap-4">
                {/* Show Poster */}
                {show.posterUrl && (
                  <img
                    src={show.posterUrl}
                    alt={show.name}
                    className="w-48 h-72 object-cover rounded-lg shadow-lg flex-shrink-0"
                  />
                )}
                
                {/* Show Details */}
                <div className="flex-1 min-w-0">
                  {/* Title, Status and Actions Row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-2xl">{show.name}</CardTitle>
                        <Select value={show.watchStatus} onValueChange={handleWatchStatusChange}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="want_to_watch">
                              <div className="flex items-center gap-2">
                                <Plus className="h-3 w-3" /> Want to Watch
                              </div>
                            </SelectItem>
                            <SelectItem value="watching">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Watching
                              </div>
                            </SelectItem>
                            <SelectItem value="watching_on_hold">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" /> Watching - On Hold
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3" /> Completed
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {show.type === 'tv_series' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={checkForTMDBUpdate}
                          disabled={isCheckingUpdate}
                          title="Check for updates"
                        >
                          <RefreshCw className={`h-4 w-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/shows/${id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(show.type)}</span>
                        <span className="text-base font-medium capitalize">{show.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Year</p>
                      <p className="font-medium">{show.releaseYear}</p>
                    </div>
                    {show.numberOfSeasons && (
                      <div>
                        <p className="text-xs text-muted-foreground">Seasons</p>
                        <p className="font-medium">{show.numberOfSeasons}</p>
                      </div>
                    )}
                    {show.rottenTomatoesRating && (
                      <div>
                        <p className="text-xs text-muted-foreground">RT Score</p>
                        <p className="font-medium">{show.rottenTomatoesRating}%</p>
                      </div>
                    )}
                    {show.myRating && (
                      <div>
                        <p className="text-xs text-muted-foreground">My Rating</p>
                        <p className="font-medium">{show.myRating}/10</p>
                      </div>
                    )}
                  </div>
                  
                  
                  {/* Description */}
                  <div className="mt-4">
                    <h3 className="font-semibold text-sm mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{show.description}</p>
                  </div>
                  
                  {/* My Rating */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">Rate This Show</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <div key={star} className="relative">
                          {/* Full star button */}
                          <button
                            onClick={() => handleUpdateRating(star)}
                            className="hover:scale-110 transition-transform"
                            title={`${star} stars`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                show.myRating && star <= show.myRating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                          {/* Half star button */}
                          <button
                            onClick={() => handleUpdateRating(star - 0.5)}
                            className="absolute inset-0 w-1/2 overflow-hidden hover:scale-110 transition-transform"
                            title={`${star - 0.5} stars`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                show.myRating && star - 0.5 <= show.myRating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                      {show.myRating && (
                        <span className="ml-2 text-sm font-medium">
                          {show.myRating}/10
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Date Added</p>
                      <p className="font-medium">{new Date(show.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{new Date(show.updatedAt).toLocaleDateString()}</p>
                    </div>
                    
                    {show.trailerLink && (
                      <div>
                        <p className="text-xs text-muted-foreground">Trailer</p>
                        <a
                          href={show.trailerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          Watch <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {newSeasonAvailable && (
                    <div className="flex items-center gap-2 mt-4 p-2 bg-warning/10 text-warning rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">New season available! Season count updated.</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* This section is now empty as all content moved to header */}
            </CardContent>
          </Card>

          {/* Progress Tracking Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Progress Tracking</CardTitle>
                  <CardDescription>
                    Track where you are in this {show.type === 'tv_series' ? 'series' : 'show'}
                  </CardDescription>
                </div>
                {show.type === 'tv_series' && show.numberOfSeasons && show.numberOfSeasons > 0 && (
                  <button
                    onClick={() => setIsSeasonModalOpen(true)}
                    className="text-right hover:bg-accent rounded-lg p-2 -m-2 transition-colors"
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-1">Completed Seasons</p>
                    <p className="text-2xl font-bold text-primary">
                      {completedSeasons.length}/{show.numberOfSeasons}
                    </p>
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {show.type === 'tv_series' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="season">Current Season</Label>
                      <Input
                        id="season"
                        type="number"
                        min="1"
                        max={show.numberOfSeasons || undefined}
                        value={progress.season}
                        onChange={(e) => setProgress({ ...progress, season: e.target.value })}
                        placeholder="Season number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="episode">Current Episode</Label>
                      <Input
                        id="episode"
                        type="number"
                        min="1"
                        value={progress.episode}
                        onChange={(e) => setProgress({ ...progress, episode: e.target.value })}
                        placeholder="Episode number"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="timeWatched">Time Watched</Label>
                    <Input
                      id="timeWatched"
                      value={progress.timeWatched}
                      onChange={(e) => setProgress({ ...progress, timeWatched: e.target.value })}
                      placeholder="e.g., 45:30"
                    />
                  </div>
                )}
                <div className="flex items-end">
                  <Button onClick={handleUpdateProgress}>Update Progress</Button>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Comments Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Comments & Notes</CardTitle>
                  <CardDescription>
                    Add your thoughts and notes about this show
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddingComment(true)}
                  disabled={isAddingComment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAddingComment && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your comment..."
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddComment}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingComment(false)
                        setNewComment("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {show.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              ) : (
                <div className="space-y-3">
                  {show.comments.map((comment) => (
                    <div key={comment.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Completed Seasons Modal */}
      <Dialog open={isSeasonModalOpen} onOpenChange={setIsSeasonModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Completed Seasons</DialogTitle>
            <DialogDescription>
              Check off the seasons you've finished watching
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left pb-2 font-medium text-sm">Season</th>
                  <th className="text-center pb-2 font-medium text-sm">Completed</th>
                </tr>
              </thead>
              <tbody>
                {show && show.numberOfSeasons && Array.from({ length: show.numberOfSeasons }, (_, i) => i + 1).map((season) => (
                  <tr key={season} className="border-b last:border-0">
                    <td className="py-2 text-sm">Season {season}</td>
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={completedSeasons.includes(season)}
                        onChange={() => toggleCompletedSeason(season)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Progress: {completedSeasons.length} of {show?.numberOfSeasons || 0} seasons completed</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSeasonModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}