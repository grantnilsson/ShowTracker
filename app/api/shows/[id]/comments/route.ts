import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { text } = await request.json()
    
    const comment = await prisma.comment.create({
      data: {
        text,
        showId: id
      }
    })
    
    // Return the updated show
    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        progress: true
      }
    })
    
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }
    
    const transformedShow = {
      ...show,
      currentProgress: show.progress ? {
        season: show.progress.season,
        episode: show.progress.episode,
        timeWatched: show.progress.timeWatched
      } : undefined,
      progress: undefined
    }
    
    return NextResponse.json(transformedShow)
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}