"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { Show, ShowType } from "@/types"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [show, setShow] = useState<Show | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rottenTomatoesRating: "",
    releaseYear: "",
    myRating: "",
    type: "movie" as ShowType,
    numberOfSeasons: "",
    trailerLink: "",
    posterUrl: "",
    watchStatus: "want_to_watch" as const
  })

  useEffect(() => {
    const loadShow = async () => {
      const foundShow = await storage.getShow(id)
      if (!foundShow) {
        router.push("/shows")
        return
      }
      setShow(foundShow)
      setFormData({
        name: foundShow.name || "",
        description: foundShow.description || "",
        rottenTomatoesRating: foundShow.rottenTomatoesRating?.toString() || "",
        releaseYear: foundShow.releaseYear?.toString() || "",
        myRating: foundShow.myRating?.toString() || "",
        type: foundShow.type || "movie",
        numberOfSeasons: foundShow.numberOfSeasons?.toString() || "",
        trailerLink: foundShow.trailerLink || "",
        posterUrl: foundShow.posterUrl || "",
        watchStatus: foundShow.watchStatus || "want_to_watch"
      })
    }
    
    loadShow()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!show) return
    
    setIsSubmitting(true)

    try {
      const updatedShow = storage.updateShow(id, {
        name: formData.name,
        description: formData.description,
        rottenTomatoesRating: formData.rottenTomatoesRating ? Number(formData.rottenTomatoesRating) : undefined,
        releaseYear: Number(formData.releaseYear),
        myRating: formData.myRating ? Number(formData.myRating) : undefined,
        type: formData.type,
        numberOfSeasons: formData.type === 'tv_series' && formData.numberOfSeasons ? Number(formData.numberOfSeasons) : undefined,
        trailerLink: formData.trailerLink || undefined,
        posterUrl: formData.posterUrl || undefined,
        watchStatus: formData.watchStatus
      })

      if (updatedShow) {
        router.push(`/shows/${id}`)
      }
    } catch (error) {
      console.error("Error updating show:", error)
      setIsSubmitting(false)
    }
  }

  if (!show) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6 max-w-4xl">
        <Link href={`/shows/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Show
        </Link>

        <Card>
          <CardHeader>
            <div className="flex gap-6">
              {/* Show Poster */}
              {show.posterUrl && (
                <img
                  src={show.posterUrl}
                  alt={show.name}
                  className="w-32 h-48 object-cover rounded-lg shadow-lg flex-shrink-0"
                />
              )}
              
              {/* Header Text */}
              <div className="flex-1">
                <CardTitle>Edit Show</CardTitle>
                <CardDescription>
                  Update the details for {show.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter show name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter show description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as ShowType })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Movie</SelectItem>
                      <SelectItem value="tv_series">TV Series</SelectItem>
                      <SelectItem value="documentary">Documentary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="releaseYear">Release Year *</Label>
                  <Input
                    id="releaseYear"
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    value={formData.releaseYear}
                    onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                  />
                </div>
              </div>

              {formData.type === 'tv_series' && (
                <div className="space-y-2">
                  <Label htmlFor="numberOfSeasons">Number of Seasons</Label>
                  <Input
                    id="numberOfSeasons"
                    type="number"
                    min="1"
                    value={formData.numberOfSeasons}
                    onChange={(e) => setFormData({ ...formData, numberOfSeasons: e.target.value })}
                    placeholder="Enter number of seasons"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rottenTomatoesRating">Rotten Tomatoes Rating (%)</Label>
                  <Input
                    id="rottenTomatoesRating"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.rottenTomatoesRating}
                    onChange={(e) => setFormData({ ...formData, rottenTomatoesRating: e.target.value })}
                    placeholder="0-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="myRating">My Rating (0-10, allows half stars)</Label>
                  <Input
                    id="myRating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={formData.myRating}
                    onChange={(e) => setFormData({ ...formData, myRating: e.target.value })}
                    placeholder="0-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can enter half values like 7.5, 8.5, etc.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trailerLink">Trailer Link</Label>
                <Input
                  id="trailerLink"
                  type="url"
                  value={formData.trailerLink}
                  onChange={(e) => setFormData({ ...formData, trailerLink: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="posterUrl">Poster Image URL</Label>
                <div className="flex gap-4">
                  <Input
                    id="posterUrl"
                    type="url"
                    value={formData.posterUrl}
                    onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                    placeholder="https://image.tmdb.org/t/p/w500/..."
                    className="flex-1"
                  />
                  {formData.posterUrl && (
                    <img
                      src={formData.posterUrl}
                      alt="Poster preview"
                      className="h-20 w-14 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="watchStatus">Watch Status *</Label>
                <Select
                  value={formData.watchStatus}
                  onValueChange={(value) => setFormData({ ...formData, watchStatus: value as "want_to_watch" | "watching" | "watching_on_hold" | "completed" })}
                >
                  <SelectTrigger id="watchStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want_to_watch">Want to Watch</SelectItem>
                    <SelectItem value="watching">Watching</SelectItem>
                    <SelectItem value="watching_on_hold">Watching - On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}