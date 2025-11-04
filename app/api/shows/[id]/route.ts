import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single show
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      completedSeasons: show.completedSeasons ? JSON.parse(show.completedSeasons) : [],
      currentProgress: show.progress ? {
        season: show.progress.season,
        episode: show.progress.episode,
        timeWatched: show.progress.timeWatched
      } : undefined,
      progress: undefined
    }
    
    return NextResponse.json(transformedShow)
  } catch (error) {
    console.error('Error fetching show:', error)
    return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 })
  }
}

// PUT update show
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { currentProgress, comments, completedSeasons, ...showData } = body
    
    // Update show
    const show = await prisma.show.update({
      where: { id },
      data: {
        ...showData,
        completedSeasons: completedSeasons ? JSON.stringify(completedSeasons) : null,
        progress: currentProgress ? {
          upsert: {
            create: {
              season: currentProgress.season,
              episode: currentProgress.episode,
              timeWatched: currentProgress.timeWatched
            },
            update: {
              season: currentProgress.season,
              episode: currentProgress.episode,
              timeWatched: currentProgress.timeWatched
            }
          }
        } : undefined
      },
      include: {
        comments: true,
        progress: true
      }
    })
    
    const transformedShow = {
      ...show,
      completedSeasons: show.completedSeasons ? JSON.parse(show.completedSeasons) : [],
      currentProgress: show.progress ? {
        season: show.progress.season,
        episode: show.progress.episode,
        timeWatched: show.progress.timeWatched
      } : undefined,
      progress: undefined
    }
    
    return NextResponse.json(transformedShow)
  } catch (error) {
    console.error('Error updating show:', error)
    return NextResponse.json({ error: 'Failed to update show' }, { status: 500 })
  }
}

// DELETE show
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.show.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting show:', error)
    return NextResponse.json({ error: 'Failed to delete show' }, { status: 500 })
  }
}