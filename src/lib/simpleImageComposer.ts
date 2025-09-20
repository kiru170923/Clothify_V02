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

export async function createSimpleComposite(
  personImageUrl: string,
  clothingItems: ClothingItem[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎨 Creating simple composite image...')
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Simple dimensions
      canvas.width = 1024
      canvas.height = 1365
      
      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 1024, 1365)
      
      // Load and draw person image
      const personImg = new Image()
      
      personImg.onload = () => {
        try {
          console.log('✅ Person image loaded')
          
          // Draw person on left half
          ctx.drawImage(personImg, 0, 0, 512, 1365)
          
          // Draw divider line
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(512, 0)
          ctx.lineTo(512, 1365)
          ctx.stroke()
          
          // Draw clothing items on right half
          if (clothingItems.length > 0) {
            const itemHeight = 1365 / clothingItems.length
            
            clothingItems.forEach((item, i) => {
              const clothingImg = new Image()
              
              clothingImg.onload = () => {
                try {
                  console.log(`✅ Clothing item ${i + 1} loaded`)
                  
                  const itemY = i * itemHeight
                  ctx.drawImage(clothingImg, 512, itemY, 512, itemHeight)
                  
                  // Add border
                  ctx.strokeStyle = '#000000'
                  ctx.lineWidth = 2
                  ctx.strokeRect(512, itemY, 512, itemHeight)
                  
                } catch (error) {
                  console.error(`❌ Error drawing clothing item ${i + 1}:`, error)
                }
              }
              
              clothingImg.onerror = (e) => {
                console.error(`❌ Failed to load clothing image ${i + 1}:`, item.label, e)
              }
              
              clothingImg.src = item.image
            })
          }
          
          // Convert to base64
          const compositeImageUrl = canvas.toDataURL('image/png', 1.0)
          console.log('✅ Simple composite created')
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
      console.error('❌ Error starting simple composite:', error)
      reject(error)
    }
  })
}
