// Image optimization utilities
export function compressImage(base64Image: string, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions (max 1024px width)
      const maxWidth = 1024
      const maxHeight = 1024
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = base64Image
  })
}

export function getImageSize(base64Image: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = base64Image
  })
}

// Optimize image before upload
export async function optimizeImageForUpload(base64Image: string): Promise<string> {
  try {
    // Get original size
    const originalSize = await getImageSize(base64Image)
    console.log('Original image size:', originalSize)
    
    // Compress if too large
    if (originalSize.width > 1024 || originalSize.height > 1024) {
      console.log('Compressing large image...')
      return await compressImage(base64Image, 0.8)
    }
    
    return base64Image
  } catch (error) {
    console.error('Image optimization failed:', error)
    return base64Image // Return original if optimization fails
  }
}
