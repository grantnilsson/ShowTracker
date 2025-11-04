# My Shows Tracker

A Next.js application for tracking TV shows and movies with TMDB integration.

## Features

- 🎬 Track movies, TV series, and documentaries
- 🌓 Light/Dark theme support
- ⭐ Personal rating system (1-5 stars)
- 💬 Add multiple comments over time
- 📊 Progress tracking (seasons/episodes for TV, time for movies)
- 🔍 Advanced TMDB search with filters:
  - Show name
  - Release year
  - Genre selection
  - Plot text search
  - Rotten Tomatoes rating range
- 📱 Responsive design

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get a TMDB API key:
   - Go to https://www.themoviedb.org/
   - Create an account or sign in
   - Go to Settings > API
   - Request an API key (choose "Developer" option)
   - Copy your API Key (v3 auth)

3. Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Usage

### Adding Shows Manually
- Click "Add Show" in the navigation
- Fill in the show details
- Set your initial rating and watch status

### Searching TMDB
- Click "Search TMDB" in the navigation
- Use any combination of filters:
  - **Show Name**: Search by title
  - **Release Year**: Filter by year
  - **Genre**: Select multiple genres
  - **Plot Text**: Search within plot descriptions
  - **Rating Range**: Filter by Rotten Tomatoes score
- Click on any result to add it to your collection

### Tracking Progress
- On any show's detail page, update your progress:
  - For TV series: Current season and episode
  - For movies/documentaries: Time watched
- Add comments to track your thoughts over time
- Update your rating by clicking the stars

## Data Storage

All data is stored locally in your browser's localStorage. To backup your data, you can export it from the browser's developer tools.