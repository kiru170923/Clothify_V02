export interface ClothingItem {
  id: string
  image: string
  type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
  label: string
  category?: string
  color?: string
  style?: string
  confidence?: number
}

export async function createCompositeImage(
  personImageUrl: string,
  clothingItems: ClothingItem[]
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎨 Starting composite image creation...')
      console.log('Person image URL:', personImageUrl)
      console.log('Clothing items count:', clothingItems.length)
      
      // Create canvas with 3:4 aspect ratio
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Simple 3:4 ratio for now
      canvas.width = 1024
      canvas.height = 1365
      
      // Load person image
      const personImg = new Image()
      personImg.crossOrigin = 'anonymous'
      
      personImg.onload = async () => {
        try {
          console.log('✅ Person image loaded, drawing...')
          
          // Draw person on left half (simple version)
          ctx.drawImage(personImg, 0, 0, 512, 1365)
          
          // Draw clothing items on right half
          if (clothingItems.length > 0) {
            const itemHeight = 1365 / clothingItems.length
            
            for (let i = 0; i < clothingItems.length; i++) {
              const item = clothingItems[i]
              const clothingImg = new Image()
              clothingImg.crossOrigin = 'anonymous'
              
              await new Promise<void>((resolveItem, rejectItem) => {
                clothingImg.onload = () => {
                  try {
                    console.log(`✅ Clothing item ${i + 1} loaded, drawing...`)
                    
                    // Calculate position
                    const itemY = i * itemHeight
                    
                    // Draw item
                    ctx.drawImage(clothingImg, 512, itemY, 512, itemHeight)
                    
                    // Add border
                    ctx.strokeStyle = '#000'
                    ctx.lineWidth = 2
                    ctx.strokeRect(512, itemY, 512, itemHeight)
                    
                    resolveItem()
                  } catch (error) {
                    console.error(`❌ Error drawing clothing item ${i + 1}:`, error)
                    rejectItem(error)
                  }
                }
                
                clothingImg.onerror = (e) => {
                  console.error(`❌ Failed to load clothing image ${i + 1}:`, item.label, e)
                  rejectItem(new Error(`Failed to load clothing image: ${item.label}`))
                }
                
                clothingImg.src = item.image
              })
            }
          }
          
          // Add divider line
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(512, 0)
          ctx.lineTo(512, 1365)
          ctx.stroke()
          
          console.log('✅ Composite image created, converting to base64...')
          
          // Convert canvas to base64
          const compositeImageUrl = canvas.toDataURL('image/png', 1.0)
          console.log('✅ Composite image URL generated')
          
          resolve(compositeImageUrl)
          
        } catch (error) {
          console.error('❌ Error in composite creation:', error)
          reject(error)
        }
      }
      
      personImg.onerror = (e) => {
        console.error('❌ Failed to load person image:', e)
        reject(new Error('Failed to load person image'))
      }
      
      personImg.src = personImageUrl
      
    } catch (error) {
      console.error('❌ Error starting composite creation:', error)
      reject(error)
    }
  })
}

// Alternative simpler version for testing
export async function createSimpleCompositeImage(
  personImageUrl: string,
  clothingItems: ClothingItem[]
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Simple 3:4 ratio
      canvas.width = 1024
      canvas.height = 1365
      
      // Load person image
      const personImg = new Image()
      personImg.crossOrigin = 'anonymous'
      
      personImg.onload = async () => {
        try {
          // Draw person on left half
          ctx.drawImage(personImg, 0, 0, 512, 1365)
          
          // Draw first clothing item on right half
          if (clothingItems.length > 0) {
            const clothingImg = new Image()
            clothingImg.crossOrigin = 'anonymous'
            
            await new Promise<void>((resolveItem, rejectItem) => {
              clothingImg.onload = () => {
                ctx.drawImage(clothingImg, 512, 0, 512, 1365)
                resolveItem()
              }
              clothingImg.onerror = () => rejectItem(new Error('Failed to load clothing image'))
              clothingImg.src = clothingItems[0].image
            })
          }
          
          // Add divider line
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(512, 0)
          ctx.lineTo(512, 1365)
          ctx.stroke()
          
          const compositeImageUrl = canvas.toDataURL('image/png', 1.0)
          resolve(compositeImageUrl)
          
        } catch (error) {
          reject(error)
        }
      }
      
      personImg.onerror = () => reject(new Error('Failed to load person image'))
      personImg.src = personImageUrl
      
    } catch (error) {
      reject(error)
    }
  })
}
