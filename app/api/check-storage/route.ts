import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: "Check your browser console - press F12 and look at the Console tab",
    instructions: "Run this in the console: localStorage.getItem('myshows_data')"
  })
}