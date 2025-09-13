import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }
    
    // Check if result is available
    if (!global.kieaiResults) {
      global.kieaiResults = {}
    }
    const result = global.kieaiResults[taskId]
    
    if (!result) {
      return NextResponse.json({ 
        success: false, 
        message: 'Task still processing...' 
      })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in result API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
