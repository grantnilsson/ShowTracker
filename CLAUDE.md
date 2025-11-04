# MyShows - TV Show Tracker

## Project Overview
A Next.js application for tracking TV shows using The Movie Database (TMDB) API.

## Deployment
- **Platform**: Railway (https://railway.app)
- **Database**: PostgreSQL on Railway
- **Repository**: https://github.com/grantnilsson/ShowTracker.git
- **Containerization**: Docker with multi-stage builds
- **Deployment Guide**: See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed instructions

## Tech Stack
- **Framework**: Next.js 15.1.5
- **Language**: TypeScript
- **Database**: PostgreSQL (production) via Prisma ORM
- **Styling**: Tailwind CSS with custom UI components
- **Theme**: Dark mode support via next-themes
- **API**: TMDB API for show data

## Project Structure
```
myshows/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── search/            # Search functionality
│   └── shows/             # Show management pages
│       ├── [id]/          # Individual show pages
│       │   ├── page.tsx   # Show details
│       │   └── edit/      # Edit show
│       ├── new/           # Add new show
│       └── page.tsx       # Shows list
├── components/            # React components
│   ├── navigation.tsx     # App navigation
│   ├── theme-*.tsx        # Theme components
│   └── ui/                # UI component library
├── lib/                   # Utility functions
│   ├── storage.ts         # Local storage handling
│   ├── tmdb.ts           # TMDB API integration
│   └── utils.ts          # Helper utilities
└── types/                 # TypeScript type definitions

## Environment Setup
The project uses environment variables:

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Railway)
- `NEXT_PUBLIC_TMDB_API_KEY`: TMDB API key for fetching show data
- `NODE_ENV`: Set to "production" for production builds

See `.env.example` for the complete list.

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma client generation)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Scripts
- `npm run db:push` - Push Prisma schema changes to database
- `npm run db:migrate` - Create and run migrations (development)
- `npm run db:migrate:deploy` - Run migrations (production)
- `npm run db:studio` - Open Prisma Studio to browse data
- `npm run db:export` - Export current database to JSON
- `npm run db:import` - Import JSON data to database

## Key Features
- Search TV shows via TMDB API
- Track personal show collection
- Add/edit/view show details
- Dark mode support
- Responsive design

## Development Notes
- Uses Next.js App Router
- TypeScript for type safety
- Tailwind CSS for styling
- PostgreSQL database via Prisma ORM
- TMDB API for show metadata
- Docker containerization for deployment
- Automated database migrations on deployment

## Database Schema
The application uses Prisma ORM with PostgreSQL. See `prisma/schema.prisma` for the full schema.

### Models
- **Show**: Main show/movie data with metadata
- **Comment**: User comments on shows
- **Progress**: Current viewing progress (season/episode/time)

## Data Migration
When deploying to Railway from a local SQLite database:

1. Export local data:
   ```bash
   npm run db:export
   ```

2. After Railway deployment, import data:
   ```bash
   railway run npm run db:import
   ```

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for complete migration instructions.