# Railway Deployment Guide

This guide walks you through deploying the MyShows application to Railway with a PostgreSQL database and migrating your existing data.

## Prerequisites

- Railway account (you already have this)
- Git repository (recommended but not required)
- Your existing SQLite database data

## Step 1: Export Existing Data

Before deploying, export your current data from the SQLite database:

```bash
npm run db:export
```

This will create a `data-export.json` file in your project root containing all your shows, comments, and progress data.

**IMPORTANT:** Keep this file safe! You'll need it to import data to your PostgreSQL database.

## Step 2: Set Up Railway Project

### Option A: Deploy via CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Create a new project:
```bash
railway init
```

4. Add PostgreSQL database:
```bash
railway add --database postgresql
```

### Option B: Deploy via Web Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo" or "Empty Project"
4. Click "Add Service" → "Database" → "PostgreSQL"

## Step 3: Configure Environment Variables

In your Railway project dashboard:

1. Go to your application service (not the database)
2. Click on "Variables" tab
3. Add the following variables:

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NODE_ENV=production
```

**Note:** `DATABASE_URL` is automatically set by Railway when you add the PostgreSQL service. You don't need to set it manually.

## Step 4: Link Database to Application

Railway should automatically link your PostgreSQL database to your application. Verify this by:

1. Go to your application service
2. Check "Variables" tab
3. You should see `DATABASE_URL` with a value like: `postgresql://postgres:...@...railway.app:5432/railway`

If not visible, click "Add Variable Reference" and select the PostgreSQL `DATABASE_URL`.

## Step 5: Deploy Application

### Option A: Deploy from GitHub

1. Push your code to GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push
```

2. In Railway dashboard:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Railway will automatically detect the Dockerfile and deploy

### Option B: Deploy via CLI

```bash
railway up
```

## Step 6: Run Database Migrations

After your first deployment:

1. In Railway dashboard, go to your application service
2. Click "Deployments" tab
3. Wait for the deployment to complete
4. The migrations will run automatically via the docker-entrypoint.sh script

Or manually run migrations via CLI:

```bash
railway run npx prisma migrate deploy
```

## Step 7: Import Your Data

Now import your exported data to the PostgreSQL database:

### Option A: Via Railway CLI

```bash
# Upload your data-export.json file
railway run npm run db:import
```

### Option B: Via Railway Shell

1. In Railway dashboard, click on your application service
2. Go to "Settings" tab
3. Scroll to "Service" section
4. Click "Open Shell"
5. Upload your `data-export.json` file
6. Run:
```bash
npm run db:import
```

### Option C: Manually Upload and Import

1. Copy the contents of `data-export.json`
2. In Railway shell, create the file:
```bash
cat > data-export.json << 'EOF'
[paste your JSON content here]
EOF
```
3. Run the import:
```bash
npm run db:import
```

## Step 8: Verify Deployment

1. Click on your application service in Railway
2. Find the public URL (e.g., `https://your-app.railway.app`)
3. Open it in your browser
4. Verify your shows appear correctly

## Step 9: Set Up Custom Domain (Optional)

1. In Railway dashboard, go to your application service
2. Click "Settings" tab
3. Scroll to "Domains" section
4. Click "Generate Domain" or "Custom Domain"

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify `DATABASE_URL` is set in your app's environment variables
2. Check that both services are in the same Railway project
3. Restart your application service

### Migration Failures

If migrations fail:

```bash
railway run npx prisma migrate reset --force
railway run npx prisma migrate deploy
```

### Import Failures

If data import fails:

1. Check the format of `data-export.json`
2. Verify the database is accessible
3. Check logs: `railway logs`
4. Try importing in smaller batches by editing the JSON file

### View Logs

```bash
railway logs
```

Or in the dashboard: Click on your service → "Deployments" → Click on a deployment → "View Logs"

### Access Database Directly

To access your PostgreSQL database:

```bash
railway run npx prisma studio
```

Or get the connection string:

```bash
railway variables
```

Then use any PostgreSQL client with the `DATABASE_URL`.

## Maintenance Commands

### View Database in Browser

```bash
railway run npx prisma studio
```

### Create New Migration

```bash
railway run npx prisma migrate dev --name your_migration_name
```

### Reset Database (DANGEROUS)

```bash
railway run npx prisma migrate reset --force
```

## Monitoring and Scaling

Railway automatically handles:
- HTTPS certificates
- Auto-scaling based on usage
- Health checks and restarts
- Resource limits (adjust in Settings)

## Cost Considerations

Railway pricing is based on:
- Resource usage (CPU/Memory)
- Database storage
- Network bandwidth

Check your current usage: Railway Dashboard → Project → "Usage" tab

## Next Steps

1. Set up monitoring (Railway provides basic metrics)
2. Configure custom domain
3. Set up GitHub auto-deployments
4. Consider adding Redis for caching (optional)
5. Set up backup strategy for your database

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Prisma Documentation: https://www.prisma.io/docs

## Important Files

- `Dockerfile` - Container configuration
- `docker-entrypoint.sh` - Startup script that runs migrations
- `railway.json` - Railway-specific configuration
- `prisma/schema.prisma` - Database schema
- `.env.example` - Environment variable template
- `scripts/export-data.js` - Data export script
- `scripts/import-data.js` - Data import script
