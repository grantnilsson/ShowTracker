import { NextRequest, NextResponse } from 'next/server'
import { tmdbApi } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    // Get all genres first
    const genresData = await tmdbApi.getGenres()
    
    // Find sci-fi genre ID
    const sciFiGenre = genresData.genres.find(g => 
      g.name.toLowerCase().includes('sci') || 
      g.name.toLowerCase().includes('fantasy')
    )
    
    if (!sciFiGenre) {
      return NextResponse.json({ error: 'Sci-Fi genre not found' })
    }
    
    // Test TV genre search
    const tvResults = await tmdbApi.discoverByGenre([sciFiGenre.id], 'tv')
    
    return NextResponse.json({
      sciFiGenre,
      totalResults: tvResults.results.length,
      results: tvResults.results.slice(0, 5).map(r => ({
        name: r.name || r.title,
        media_type: r.media_type,
        overview: r.overview?.substring(0, 100) + '...',
        first_air_date: r.first_air_date,
        genre_ids: r.genre_ids
      }))
    })
  } catch (error) {
    console.error('Genre test error:', error)
    return NextResponse.json({ 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}