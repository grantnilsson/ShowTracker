import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null
try {
  const { prisma: prismaClient } = require('@/lib/prisma')
  prisma = prismaClient
} catch (error) {
  console.error('Prisma client not found. Please run: npx prisma generate')
}

// GET all shows
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not initialized. Please run: npx prisma generate' }, { status: 503 })
    }
    
    const shows = await prisma.show.findMany({
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        progress: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    // Transform the data to match our frontend format
    const transformedShows = shows.map((show: any) => ({
      ...show,
      completedSeasons: show.completedSeasons ? JSON.parse(show.completedSeasons) : [],
      currentProgress: show.progress ? {
        season: show.progress.season,
        episode: show.progress.episode,
        timeWatched: show.progress.timeWatched
      } : undefined,
      progress: undefined // Remove the progress object
    }))
    
    return NextResponse.json(transformedShows)
  } catch (error) {
    console.error('Error fetching shows:', error)
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}

// POST create new show
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client not available')
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 })
    }
    
    const body = await request.json()
    console.log('Creating show in database:', body.name)
    const { currentProgress, comments, completedSeasons, ...showData } = body
    
    const show = await prisma.show.create({
      data: {
        ...showData,
        completedSeasons: completedSeasons ? JSON.stringify(completedSeasons) : null,
        comments: {
          create: comments || []
        },
        progress: currentProgress ? {
          create: {
            season: currentProgress.season,
            episode: currentProgress.episode,
            timeWatched: currentProgress.timeWatched
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
    console.error('Error creating show:', error)
    return NextResponse.json({ error: 'Failed to create show' }, { status: 500 })
  }
}