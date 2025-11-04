# MyShows - TV Show Tracker

## Project Overview
A Next.js application for tracking TV shows using The Movie Database (TMDB) API.

## Tech Stack
- **Framework**: Next.js 15.1.5
- **Language**: TypeScript
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
The project uses environment variables stored in `.env.local`:
- `NEXT_PUBLIC_TMDB_API_KEY`: TMDB API key for fetching show data

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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
- Local storage for data persistence
- TMDB API for show metadata