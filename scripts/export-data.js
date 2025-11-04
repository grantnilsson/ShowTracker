const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('Exporting data from SQLite database...')

    // Fetch all shows with their relations
    const shows = await prisma.show.findMany({
      include: {
        comments: true,
        progress: true
      }
    })

    console.log(`Found ${shows.length} shows to export`)

    // Transform the data to match the export format
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      shows: shows.map(show => ({
        ...show,
        completedSeasons: show.completedSeasons ? JSON.parse(show.completedSeasons) : [],
        currentProgress: show.progress ? {
          season: show.progress.season,
          episode: show.progress.episode,
          timeWatched: show.progress.timeWatched
        } : undefined
      }))
    }

    // Save to file
    const exportPath = path.join(process.cwd(), 'data-export.json')
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))

    console.log(`✓ Data exported successfully to: ${exportPath}`)
    console.log(`  Total shows: ${shows.length}`)
    console.log(`  Total comments: ${shows.reduce((acc, s) => acc + s.comments.length, 0)}`)

  } catch (error) {
    console.error('Error exporting data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
