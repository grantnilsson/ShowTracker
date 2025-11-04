import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' })
  }
  
  try {
    // Test with a simple movie search
    const testUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
    const response = await fetch(testUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: 'API request failed', 
        status: response.status,
        statusText: response.statusText,
        errorText
      })
    }
    
    const data = await response.json()
    
    // Also test TV discover
    const tvUrl = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_genres=10765&sort_by=popularity.desc`
    const tvResponse = await fetch(tvUrl)
    const tvData = await tvResponse.json()
    
    return NextResponse.json({
      apiKey: apiKey.substring(0, 8) + '...',
      popularMovies: {
        success: true,
        count: data.results?.length || 0,
        sample: data.results?.slice(0, 3).map((m: any) => m.title)
      },
      sciFiTV: {
        success: tvResponse.ok,
        count: tvData.results?.length || 0,
        totalPages: tvData.total_pages,
        totalResults: tvData.total_results,
        sample: tvData.results?.slice(0, 3).map((t: any) => t.name)
      },
      raw: {
        tvUrl,
        tvData: tvData
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      message: String(error) 
    })
  }
}