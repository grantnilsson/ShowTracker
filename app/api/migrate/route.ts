import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST migrate data from localStorage to database
export async function POST(request: NextRequest) {
  try {
    const { shows } = await request.json()
    
    if (!shows || !Array.isArray(shows)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    // Delete all existing data (optional - remove if you want to keep existing data)
    await prisma.comment.deleteMany()
    await prisma.progress.deleteMany()
    await prisma.show.deleteMany()
    
    // Migrate each show
    for (const show of shows) {
      const { currentProgress, comments, ...showData } = show
      
      await prisma.show.create({
        data: {
          id: showData.id,
          name: showData.name,
          description: showData.description,
          rottenTomatoesRating: showData.rottenTomatoesRating,
          releaseYear: showData.releaseYear,
          myRating: showData.myRating,
          type: showData.type,
          numberOfSeasons: showData.numberOfSeasons,
          trailerLink: showData.trailerLink,
          posterUrl: showData.posterUrl,
          watchStatus: showData.watchStatus,
          createdAt: new Date(showData.createdAt),
          updatedAt: new Date(showData.updatedAt),
          comments: {
            create: (comments || []).map((comment: any) => ({
              id: comment.id,
              text: comment.text,
              createdAt: new Date(comment.createdAt)
            }))
          },
          progress: currentProgress ? {
            create: {
              season: currentProgress.season,
              episode: currentProgress.episode,
              timeWatched: currentProgress.timeWatched
            }
          } : undefined
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Migrated ${shows.length} shows to database` 
    })
  } catch (error) {
    console.error('Error migrating data:', error)
    return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 })
  }
}