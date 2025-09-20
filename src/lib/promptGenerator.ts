// Advanced prompt generation for better try-on results

export interface ClothingType {
  type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessories'
  category: 'shirt' | 'pants' | 'shorts' | 'skirt' | 'dress' | 'jacket' | 'hoodie' | 'tank' | 'blouse'
}

// Function to add face preservation emphasis based on clothing type
function getFacePreservationInstructions(clothingItems?: Array<{
  type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
  label: string
  category?: string
  color?: string
  style?: string
}>): string {
  if (!clothingItems || clothingItems.length === 0) {
    return 'Maintain 100% facial identity and body proportions during clothing replacement.'
  }

  const types = clothingItems.map(item => item.type)
  
  if (types.includes('top') || types.includes('outerwear')) {
    return 'CRITICAL: When changing upper garments, ensure facial features, neck, and shoulders remain EXACTLY the same. Only replace clothing from neckline down.'
  } else if (types.includes('dress')) {
    return 'CRITICAL: When changing dress, maintain exact facial features and head positioning. Only replace garment from neckline down to hemline.'
  } else if (types.includes('bottom') || types.includes('shoes')) {
    return 'CRITICAL: When changing lower garments, keep upper body including face, torso, and arms EXACTLY identical. Only replace clothing from waist down.'
  }
  
  return 'Maintain 100% facial identity and body proportions during clothing replacement.'
}

export function generateAdvancedPrompt(clothingImageUrl: string, clothingItems?: Array<{
  type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
  label: string
  category?: string
  color?: string
  style?: string
}>, isComposite?: boolean, selectedGarmentType?: 'auto' | 'top' | 'bottom' | 'full-body'): {
  prompt: string
  negativePrompt: string
  parameters: Record<string, any>
} {
  // Analyze clothing items and create intelligent prompt
  let outfitDescription = ''
  let technicalInstructions = ''
  
  if (clothingItems && clothingItems.length > 0) {
    const itemsByType = clothingItems.reduce((acc, item) => {
      acc[item.type] = item
      return acc
    }, {} as Record<string, any>)

    // Build outfit description based on detected items
    const outfitParts = []
    
    if (itemsByType.dress) {
      const dressDesc = `elegant ${itemsByType.dress.color || ''} ${itemsByType.dress.category || 'dress'}`.trim()
      outfitDescription = dressDesc || 'elegant dress'
      technicalInstructions = 'Ensure the dress flows naturally from neckline to hem, maintaining perfect fit and elegant drape throughout the entire silhouette.'
    } else {
      // Build layered outfit
      if (itemsByType.top) {
        const topDesc = `${itemsByType.top.color || ''} ${itemsByType.top.category || 'top'}`.trim()
        if (topDesc) outfitParts.push(topDesc)
      }
      if (itemsByType.outerwear) {
        const outerDesc = `${itemsByType.outerwear.color || ''} ${itemsByType.outerwear.category || 'outerwear'}`.trim()
        if (outerDesc) outfitParts.push(outerDesc)
      }
      if (itemsByType.bottom) {
        const bottomDesc = `${itemsByType.bottom.color || ''} ${itemsByType.bottom.category || 'bottom'}`.trim()
        if (bottomDesc) outfitParts.push(bottomDesc)
      }
      if (itemsByType.shoes) {
        const shoesDesc = `${itemsByType.shoes.color || ''} ${itemsByType.shoes.category || 'footwear'}`.trim()
        if (shoesDesc) outfitParts.push(shoesDesc)
      }
      if (itemsByType.accessory) {
        const accessoryDesc = (itemsByType.accessory.category || 'accessories').trim()
        if (accessoryDesc) outfitParts.push(accessoryDesc)
      }
      
      outfitDescription = outfitParts.filter(part => part.trim()).join(' with ')
      technicalInstructions = 'Ensure perfect coordination between all clothing layers, maintaining natural fabric interaction and proper fit for each individual garment.'
    }
  } else {
    outfitDescription = 'the new garment from the reference image'
    technicalInstructions = 'Ensure the garment fits naturally and maintains proper proportions.'
  }

  // Get specific face preservation instructions based on clothing type
  const facePreservationInstructions = getFacePreservationInstructions(clothingItems)

  // ENHANCED PROMPT BASED ON GARMENT TYPE
  let basePrompt = ''
  let negativePrompt = ''

  if (selectedGarmentType === 'top') {
    basePrompt = `Replace the ENTIRE upper clothing (including sleeves, collar, fabric type) of the person in the first image with the COMPLETE top garment from the second image. Keep the same face, body shape, and pose. Replace ALL upper clothing details including sleeve length, style, and material.`
    negativePrompt = `face modification, body distortion, background change, multiple people, low quality, blur, artifacts, different pose, different gender, bottom change, pants change, shoes change, partial clothing change, mixed sleeve styles`
  } else if (selectedGarmentType === 'bottom') {
    basePrompt = `Replace the bottom/pants of the person in the first image with the bottom garment from the second image. Keep the same face, body shape, and pose. Only change the lower clothing.`
    negativePrompt = `face modification, body distortion, background change, multiple people, low quality, blur, artifacts, different pose, different gender, top change, shirt change, upper change`
  } else if (selectedGarmentType === 'full-body') {
    basePrompt = `Replace the entire outfit of the person in the first image with the full-body garment from the second image. Keep the same face, body shape, and pose. Replace complete outfit.`
    negativePrompt = `face modification, body distortion, background change, multiple people, low quality, blur, artifacts, different pose, different gender`
  } else {
    // Auto - let AI decide but be more specific about complete replacement
    basePrompt = `Replace the clothing of the person in the first image with the garment from the second image. Keep the same face, body shape, and pose. Ensure COMPLETE replacement of all clothing details including sleeves, style, and material.`
    negativePrompt = `face modification, body distortion, background change, multiple people, low quality, blur, artifacts, different pose, different gender, partial clothing change, mixed styles, inconsistent details`
  }

  // AGGRESSIVE PARAMETERS FOR COMPLETE CLOTHING CHANGE
  const parameters = {
    guidance_scale: 12.0, // Even higher guidance to force complete change
    num_inference_steps: 50, // More steps for thorough complete replacement
    strength: 0.5, // Balanced strength for natural replacement
    seed: Math.floor(Math.random() * 1000000),
    scheduler: 'DPMSolverMultistepScheduler',
    eta: 0.0,
    clip_skip: 1,
  }

  return {
    prompt: basePrompt,
    negativePrompt,
    parameters
  }
}

// Function to analyze clothing type from image (placeholder for future ML implementation)
export function analyzeClothingType(imageUrl: string): Promise<ClothingType> {
  // This would ideally use a computer vision model to analyze the clothing
  // For now, return a default type
  return Promise.resolve({
    type: 'top',
    category: 'shirt'
  })
}

// Generate specific prompts for different clothing types
export function generateClothingSpecificPrompt(clothingType: ClothingType): string {
  const baseRequirements = `
CRITICAL REQUIREMENTS:
- Completely remove ALL existing clothing items
- The new garment should fit naturally and realistically
- Maintain proper proportions and body shape
- Ensure seamless integration with skin and body contours
- Preserve original pose, lighting, and background
- No remnants or artifacts from old clothing
- Professional photography quality`

  switch (clothingType.type) {
    case 'top':
      return `${baseRequirements}
      
TOP-SPECIFIC REQUIREMENTS:
- Ensure the garment sits properly on shoulders and chest
- Maintain natural fabric drape and fit
- Preserve neckline and sleeve details
- Ensure proper waist integration (no gap between top and bottom)
- Maintain consistent lighting on the new garment`

    case 'bottom':
      return `${baseRequirements}
      
BOTTOM-SPECIFIC REQUIREMENTS:
- Ensure proper fit at waist and hips
- Maintain natural fabric drape and movement
- Preserve hemline details
- Ensure seamless integration with torso
- Maintain consistent lighting and shadows`

    case 'dress':
      return `${baseRequirements}
      
DRESS-SPECIFIC REQUIREMENTS:
- Ensure proper fit from top to bottom
- Maintain natural fabric drape throughout
- Preserve all design details (neckline, sleeves, hemline)
- Ensure seamless integration with body contours
- Maintain consistent lighting and shadows`

    default:
      return baseRequirements
  }
}
