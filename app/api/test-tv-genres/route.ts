import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' })
  }
  
  try {
    // First, get TV genres to see what's available
    const genresUrl = `https://api.themoviedb.org/3/genre/tv/list?api_key=${apiKey}`
    const genresResponse = await fetch(genresUrl)
    const genresData = await genresResponse.json()
    
    // Find sci-fi related genres
    const sciFiGenres = genresData.genres.filter((g: any) => 
      g.name.toLowerCase().includes('sci') || 
      g.name.toLowerCase().includes('fantasy')
    )
    
    // Test different discover endpoints
    const tests = []
    
    // Test 1: TV discover with sci-fi genres
    if (sciFiGenres.length > 0) {
      const genreIds = sciFiGenres.map((g: any) => g.id).join(',')
      const discoverUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${genreIds}&sort_by=popularity.desc`
      const discoverResponse = await fetch(discoverUrl)
      const discoverData = await discoverResponse.json()
      
      tests.push({
        name: 'TV Discover with Sci-Fi Genres',
        url: discoverUrl.replace(apiKey, 'API_KEY_HIDDEN'),
        genreIds: genreIds,
        totalResults: discoverData.total_results,
        totalPages: discoverData.total_pages,
        resultCount: discoverData.results?.length || 0,
        sample: discoverData.results?.slice(0, 3).map((r: any) => ({
          name: r.name,
          id: r.id,
          genre_ids: r.genre_ids,
          first_air_date: r.first_air_date
        }))
      })
    }
    
    // Test 2: Try each sci-fi genre individually
    for (const genre of sciFiGenres) {
      const singleGenreUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=${genre.id}&sort_by=popularity.desc`
      const singleResponse = await fetch(singleGenreUrl)
      const singleData = await singleResponse.json()
      
      tests.push({
        name: `TV Discover with ${genre.name} (${genre.id})`,
        url: singleGenreUrl.replace(apiKey, 'API_KEY_HIDDEN'),
        genreId: genre.id,
        totalResults: singleData.total_results,
        totalPages: singleData.total_pages,
        resultCount: singleData.results?.length || 0,
        sample: singleData.results?.slice(0, 3).map((r: any) => ({
          name: r.name,
          id: r.id,
          genre_ids: r.genre_ids
        }))
      })
    }
    
    // Test 3: Movie discover with same genres for comparison
    if (sciFiGenres.length > 0) {
      const genreIds = sciFiGenres.map((g: any) => g.id).join(',')
      const movieUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreIds}&sort_by=popularity.desc`
      const movieResponse = await fetch(movieUrl)
      const movieData = await movieResponse.json()
      
      tests.push({
        name: 'Movie Discover with Same Genres (for comparison)',
        url: movieUrl.replace(apiKey, 'API_KEY_HIDDEN'),
        genreIds: genreIds,
        totalResults: movieData.total_results,
        totalPages: movieData.total_pages,
        resultCount: movieData.results?.length || 0,
        sample: movieData.results?.slice(0, 3).map((r: any) => ({
          title: r.title,
          id: r.id,
          genre_ids: r.genre_ids
        }))
      })
    }
    
    // Test 4: Popular TV shows to verify API is working
    const popularUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}`
    const popularResponse = await fetch(popularUrl)
    const popularData = await popularResponse.json()
    
    tests.push({
      name: 'Popular TV Shows (baseline test)',
      url: popularUrl.replace(apiKey, 'API_KEY_HIDDEN'),
      totalResults: popularData.total_results,
      totalPages: popularData.total_pages,
      resultCount: popularData.results?.length || 0,
      sample: popularData.results?.slice(0, 3).map((r: any) => ({
        name: r.name,
        id: r.id,
        genre_ids: r.genre_ids
      }))
    })
    
    return NextResponse.json({
      tvGenres: genresData.genres,
      sciFiGenres: sciFiGenres,
      tests: tests
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      message: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}