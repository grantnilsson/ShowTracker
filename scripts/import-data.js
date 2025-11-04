const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importData() {
  try {
    console.log('Importing data to PostgreSQL database...')

    // Read the export file
    const exportPath = path.join(process.cwd(), 'data-export.json')

    if (!fs.existsSync(exportPath)) {
      console.error(`Export file not found: ${exportPath}`)
      console.log('Please run "npm run db:export" first to create the export file')
      process.exit(1)
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'))

    console.log(`Import file created at: ${exportData.exportedAt}`)
    console.log(`Found ${exportData.shows.length} shows to import`)

    let imported = 0
    let skipped = 0

    for (const show of exportData.shows) {
      try {
        // Check if show already exists
        const existing = await prisma.show.findUnique({
          where: { id: show.id }
        })

        if (existing) {
          console.log(`  Skipping "${show.name}" (already exists)`)
          skipped++
          continue
        }

        // Import show with relations
        const { currentProgress, comments, progress, completedSeasons, ...showData } = show

        await prisma.show.create({
          data: {
            ...showData,
            completedSeasons: completedSeasons ? JSON.stringify(completedSeasons) : null,
            comments: {
              create: comments.map(c => ({
                id: c.id,
                text: c.text,
                createdAt: new Date(c.createdAt)
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

        console.log(`  ✓ Imported "${show.name}"`)
        imported++

      } catch (error) {
        console.error(`  ✗ Failed to import "${show.name}":`, error.message)
      }
    }

    console.log('\n=== Import Summary ===')
    console.log(`Total shows in export: ${exportData.shows.length}`)
    console.log(`Successfully imported: ${imported}`)
    console.log(`Skipped (already exist): ${skipped}`)
    console.log(`Failed: ${exportData.shows.length - imported - skipped}`)

  } catch (error) {
    console.error('Error importing data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()
