import { NextRequest, NextResponse } from 'next/server'

// Vercel Web Analytics API endpoint
// Documentation: https://vercel.com/docs/analytics/api

export async function GET(request: NextRequest) {
  try {
    const vercelToken = process.env.VERCEL_API_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID
    const teamId = process.env.VERCEL_TEAM_ID

    if (!vercelToken || !projectId) {
      return NextResponse.json(
        { 
          error: 'Missing Vercel API configuration',
          message: 'Set VERCEL_API_TOKEN and VERCEL_PROJECT_ID in .env.local'
        },
        { status: 400 }
      )
    }

    // Fetch analytics data from Vercel
    const analyticsUrl = teamId 
      ? `https://api.vercel.com/v1/analytics/projects/${projectId}?teamId=${teamId}`
      : `https://api.vercel.com/v1/analytics/projects/${projectId}`

    const response = await fetch(analyticsUrl, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Vercel API Error:', response.status, response.statusText)
      return NextResponse.json(
        { 
          error: 'Failed to fetch Vercel analytics',
          status: response.status
        },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Extract relevant metrics
    const analytics = {
      timestamp: new Date().toISOString(),
      concurrentUsers: data.summary?.totalConcurrentUsers || 0,
      pageViews: data.summary?.totalPageViews || 0,
      pageViewsPercentChange: data.summary?.pageViewsPercentChange || 0,
      totalUsers: data.summary?.totalUsers || 0,
      totalVisits: data.summary?.totalVisits || 0,
      visitsPercentChange: data.summary?.visitsPercentChange || 0,
      averageSessionDuration: data.summary?.averageSessionDuration || 0,
      bounceRate: data.summary?.bounceRate || 0,
      topPages: data.topPages || [],
      topReferrers: data.topReferrers || [],
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching Vercel analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
