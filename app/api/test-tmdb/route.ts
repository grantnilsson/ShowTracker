import { NextRequest, NextResponse } from 'next/server'
import { tmdbApi } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || 'Breaking Bad'
    
    // Test all three search methods
    const [multiResults, movieResults, tvResults] = await Promise.all([
      tmdbApi.searchMulti(query),
      tmdbApi.searchMovies(query),
      tmdbApi.searchTV(query)
    ])
    
    return NextResponse.json({
      query,
      multi: {
        count: multiResults.results.length,
        sample: multiResults.results.slice(0, 3).map(r => ({
          name: r.name || r.title,
          media_type: r.media_type,
          id: r.id
        }))
      },
      movies: {
        count: movieResults.results.length,
        sample: movieResults.results.slice(0, 3).map(r => ({
          title: r.title,
          id: r.id
        }))
      },
      tv: {
        count: tvResults.results.length,
        sample: tvResults.results.slice(0, 3).map(r => ({
          name: r.name,
          id: r.id
        }))
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}