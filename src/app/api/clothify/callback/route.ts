import { NextRequest, NextResponse } from 'next/server'

// Type for kieaiResults
type KieaiResults = {
  [taskId: string]: {
    success: boolean;
    resultImage?: string;
    taskId: string;
    processingTime?: string;
    error?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('KIE.AI Callback received:', data)
    
    // Store the result in a simple in-memory store
    // In production, you'd want to use a database
    if (data.code === 200 && data.data.state === 'success') {
      const resultJson = JSON.parse(data.data.resultJson)
      const resultImageUrl = resultJson.resultUrls[0]
      
      // Store result for the frontend to fetch
      (global as any).kieaiResults = (global as any).kieaiResults || {}
      ;(global as any).kieaiResults[data.data.taskId] = {
        success: true,
        resultImage: resultImageUrl,
        taskId: data.data.taskId,
        processingTime: `${Math.floor((data.data.completeTime - data.data.createTime) / 1000)}s`
      }
    } else {
      (global as any).kieaiResults = (global as any).kieaiResults || {}
      ;(global as any).kieaiResults[data.data.taskId] = {
        success: false,
        error: data.data.failMsg || 'Generation failed',
        taskId: data.data.taskId
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in callback:', error)
    return NextResponse.json({ error: 'Callback error' }, { status: 500 })
  }
}
