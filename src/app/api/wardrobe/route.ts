﻿import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { APP_URL } from '../../../lib/config'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Wardrobe API called')

    // Get user session
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log('âŒ Auth error:', authError)
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('âœ… User authenticated:', user.id)

    // Pagination params
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 50)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get user's wardrobe items with range
    const { data: items, error, count } = await supabaseAdmin
      .from('user_wardrobe')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('âŒ Error fetching wardrobe items:', error)
      return NextResponse.json({ error: 'Failed to fetch wardrobe items' }, { status: 500 })
    }

    console.log('âœ… Found wardrobe items:', items?.length || 0)

    return NextResponse.json({ success: true, items: items || [], page, pageSize, total: count || 0 })

  } catch (error) {
    console.error('âŒ Wardrobe Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wardrobe items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('ðŸ“¤ Add Wardrobe Item API called')

    // Get user session
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log('âŒ Auth error:', authError)
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('âœ… User authenticated:', user.id)

    const { imageUrl, name = 'Wardrobe Item' } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    let finalImageUrl = imageUrl

    // If it's base64, upload to Supabase first
    if (imageUrl.startsWith('data:image/')) {
      console.log('ðŸ“¤ Uploading base64 image to Supabase...')
      
      // Convert base64 to buffer
      const base64Data = imageUrl.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Upload to Supabase storage
      const bucketNames = ['user-uploads', 'uploads', 'images', 'wardrobe']
      let uploadResponse = null
      let bucketName = 'user-uploads'
      
      for (const bucket of bucketNames) {
        try {
          uploadResponse = await supabaseAdmin.storage
            .from(bucket)
            .upload(`${user.id}/wardrobe/${Date.now()}.png`, buffer, {
              contentType: 'image/png',
              upsert: false
            })
          
          if (!uploadResponse.error) {
            bucketName = bucket
            console.log(`âœ… Uploaded to bucket: ${bucket}`)
            break
          }
        } catch (error) {
          console.log(`âŒ Bucket ${bucket} not available, trying next...`)
          continue
        }
      }
      
      if (!uploadResponse || uploadResponse.error) {
        console.error('âŒ All buckets failed, creating user-uploads bucket...')
        
        // Try to create bucket
        try {
          console.log('ðŸ”„ Creating user-uploads bucket...')
          const createBucketResponse = await supabaseAdmin.storage.createBucket('user-uploads', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            fileSizeLimit: 10485760 // 10MB
          })
          
          console.log('ðŸ“¦ Bucket creation response:', createBucketResponse)
          
          if (createBucketResponse.error) {
            console.error('âŒ Bucket creation error:', createBucketResponse.error)
            bucketName = 'user-uploads'
          } else {
            console.log('âœ… Bucket created successfully')
            bucketName = 'user-uploads'
          }
          
          // Retry upload
          uploadResponse = await supabaseAdmin.storage
            .from('user-uploads')
            .upload(`${user.id}/wardrobe/${Date.now()}.png`, buffer, {
              contentType: 'image/png',
              upsert: false
            })
            
          console.log('ðŸ”„ Retry upload response:', uploadResponse)
            
        } catch (createError) {
          console.error('âŒ Failed to create bucket:', createError)
          bucketName = 'user-uploads'
        }
      }

      if (!uploadResponse || uploadResponse.error) {
        console.error('âŒ Upload error:', uploadResponse?.error)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }

      // Get public URL
      finalImageUrl = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(uploadResponse.data.path).data.publicUrl

      console.log('âœ… Image uploaded to Supabase:', finalImageUrl)
    }

    // Classify clothing using AI
    let classification = null
    try {
      console.log('ðŸ¤– Starting AI classification...')
      const classifyResponse = await fetch(`${APP_URL}/api/classify-clothing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: finalImageUrl })
      })
      
      if (classifyResponse.ok) {
        const classifyData = await classifyResponse.json()
        console.log('ðŸ“¡ Classification API response:', classifyData)
        if (classifyData.success) {
          classification = classifyData.classification
          console.log('âœ… AI Classification successful:', classification)
        } else {
          console.log('âš ï¸ Classification API returned success=false:', classifyData.error)
        }
      } else {
        console.log('âš ï¸ Classification failed with status:', classifyResponse.status)
        const errorText = await classifyResponse.text()
        console.log('âŒ Classification error response:', errorText)
      }
    } catch (classifyError) {
      console.log('âš ï¸ Classification error, using default:', classifyError)
    }

    // Save wardrobe item to database with classification
    const { data: savedItem, error: saveError } = await supabaseAdmin
      .from('user_wardrobe')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        image_url: finalImageUrl,
        name: name,
        category: classification?.category || 'top',
        subcategory: classification?.subcategory || 'unknown',
        color: classification?.color || 'unknown',
        style: classification?.style || 'casual',
        season: classification?.season || 'all-season',
        gender: classification?.gender || 'unisex',
        confidence: classification?.confidence || 50,
        description: classification?.description || 'Trang phá»¥c Ä‘Æ°á»£c thÃªm vÃ o tá»§ Ä‘á»“'
      })
      .select()
      .single()

    if (saveError) {
      console.error('âŒ Error saving wardrobe item:', saveError)
      return NextResponse.json({ error: 'Failed to save wardrobe item' }, { status: 500 })
    }

    console.log('âœ… Wardrobe item saved:', savedItem.id)

    return NextResponse.json({
      success: true,
      item: savedItem
    })

  } catch (error) {
    console.error('âŒ Wardrobe POST Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add wardrobe item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('ðŸ—‘ï¸ Delete Wardrobe Item API called')

    // Get user session
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log('âŒ Auth error:', authError)
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('âœ… User authenticated:', user.id)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Delete wardrobe item
    const { error: deleteError } = await supabaseAdmin
      .from('user_wardrobe')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own items

    if (deleteError) {
      console.error('âŒ Error deleting wardrobe item:', deleteError)
      return NextResponse.json({ error: 'Failed to delete wardrobe item' }, { status: 500 })
    }

    console.log('âœ… Wardrobe item deleted:', id)

    return NextResponse.json({
      success: true,
      message: 'Wardrobe item deleted successfully'
    })

  } catch (error) {
    console.error('âŒ Wardrobe DELETE Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete wardrobe item' },
      { status: 500 }
    )
  }
}

