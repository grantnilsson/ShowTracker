import { NextRequest, NextResponse } from 'next/server'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  try {
    // Get API key from server environment
    const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY

    if (!apiKey) {
      console.error('TMDB API key not found in environment variables')
      return NextResponse.json(
        { error: 'TMDB API key not configured' },
        { status: 500 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter required' },
        { status: 400 }
      )
    }

    // Build TMDB URL with all query params
    const params = new URLSearchParams()
    params.set('api_key', apiKey)

    // Copy all other query params except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        params.set(key, value)
      }
    })

    const url = `${TMDB_BASE_URL}${endpoint}?${params}`
    console.log('TMDB Proxy Request:', endpoint)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TMDB API Error:', response.status, errorText)
      return NextResponse.json(
        { error: `TMDB API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('TMDB proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from TMDB' },
      { status: 500 }
    )
  }
}
