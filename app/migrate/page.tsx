"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Database, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function MigratePage() {
  const router = useRouter()
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleMigration = async () => {
    setMigrationStatus('migrating')
    setMessage('Migrating your data to the database...')

    try {
      const success = await storage.migrateToDatabase()
      
      if (success) {
        setMigrationStatus('success')
        setMessage('Migration completed successfully! Your data is now stored in the database.')
        
        // Clear localStorage after successful migration
        localStorage.removeItem('myshows_data')
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setMigrationStatus('error')
        setMessage('No data found in localStorage to migrate.')
      }
    } catch (error) {
      setMigrationStatus('error')
      setMessage('Migration failed. Please try again or contact support.')
      console.error('Migration error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-6 w-6" />
              Migrate to Database
            </CardTitle>
            <CardDescription>
              Transfer your show data from browser storage to a persistent database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This app now supports database storage for better data persistence and reliability. 
                Click the button below to migrate your existing data.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Before you migrate:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Your data will be safely transferred to the database</li>
                  <li>The app will continue to work offline with local backup</li>
                  <li>This is a one-time process</li>
                  <li>Your localStorage data will be cleared after migration</li>
                </ul>
              </div>

              {migrationStatus === 'idle' && (
                <Button 
                  onClick={handleMigration} 
                  className="w-full"
                  size="lg"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Start Migration
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {migrationStatus === 'migrating' && (
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">{message}</p>
                </div>
              )}

              {migrationStatus === 'success' && (
                <div className="text-center space-y-3">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500" />
                  <p className="text-green-600 font-medium">{message}</p>
                  <p className="text-sm text-muted-foreground">Redirecting to home...</p>
                </div>
              )}

              {migrationStatus === 'error' && (
                <div className="text-center space-y-3">
                  <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                  <p className="text-red-600">{message}</p>
                  <Button 
                    onClick={handleMigration} 
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}