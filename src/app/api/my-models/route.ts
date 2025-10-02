import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 My Models API called')

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

    // Get user's models
    const { data: models, error } = await supabaseAdmin
      .from('user_models')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('âŒ Error fetching models:', error)
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
    }

    console.log('âœ… Found models:', models?.length || 0)
    console.log('ðŸ“‹ Models data:', models)

    return NextResponse.json({
      success: true,
      models: models || []
    })

  } catch (error) {
    console.error('âŒ My Models Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('ðŸ“¤ Upload Model API called')

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

    const { imageUrl, name = 'Custom Model' } = await request.json()

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
      
      // Upload to Supabase storage (try different bucket names)
      const bucketNames = ['user-uploads', 'uploads', 'images', 'models']
      let uploadResponse = null
      let bucketName = 'user-uploads'
      
      for (const bucket of bucketNames) {
        try {
          uploadResponse = await supabaseAdmin.storage
            .from(bucket)
            .upload(`${user.id}/models/${Date.now()}.png`, buffer, {
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
              // Try to use existing bucket even if creation failed
              bucketName = 'user-uploads'
            } else {
              console.log('âœ… Bucket created successfully')
              bucketName = 'user-uploads'
            }
            
            // Retry upload
            uploadResponse = await supabaseAdmin.storage
              .from('user-uploads')
              .upload(`${user.id}/models/${Date.now()}.png`, buffer, {
                contentType: 'image/png',
                upsert: false
              })
              
            console.log('ðŸ”„ Retry upload response:', uploadResponse)
              
          } catch (createError) {
            console.error('âŒ Failed to create bucket:', createError)
            // Continue with upload anyway
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
      console.log('ðŸ“Š Upload details:', {
        bucketName,
        fileName: `${user.id}/models/${Date.now()}.png`,
        fileSize: buffer.length,
        contentType: 'image/png'
      })
    }


    // Save uploaded model to database with classification
    const { data: savedModel, error: saveError } = await supabaseAdmin
      .from('user_models')
      .insert({
        id: crypto.randomUUID(), // Generate UUID in code
        user_id: user.id,
        image_url: finalImageUrl,
        prompt: name,
        style: 'uploaded',
      })
      .select()
      .single()

    if (saveError) {
      console.error('âŒ Error saving model:', saveError)
      return NextResponse.json({ error: 'Failed to save model' }, { status: 500 })
    }

    console.log('âœ… Model saved:', savedModel.id)

    return NextResponse.json({
      success: true,
      model: savedModel
    })

  } catch (error) {
    console.error('âŒ Upload Model Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload model' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('ðŸ—‘ï¸ Delete Model API called')

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

    const { modelId } = await request.json()

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }

    // Delete model from database
    const { error: deleteError } = await supabaseAdmin
      .from('user_models')
      .delete()
      .eq('id', modelId)
      .eq('user_id', user.id) // Ensure user can only delete their own models

    if (deleteError) {
      console.error('âŒ Error deleting model:', deleteError)
      return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
    }

    console.log('âœ… Model deleted:', modelId)

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('âŒ Delete Model Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete model' },
      { status: 500 }
    )
  }
}

