// Advanced prompt generation for better try-on results

export interface ClothingType {
  type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'accessories'
  category: 'shirt' | 'pants' | 'shorts' | 'skirt' | 'dress' | 'jacket' | 'hoodie' | 'tank' | 'blouse'
}

export function generateAdvancedPrompt(clothingImageUrl: string): {
  prompt: string
  negativePrompt: string
  parameters: Record<string, any>
} {
  // Base prompt structure
  const basePrompt = `Professional virtual try-on: Replace the person's clothing with the new garment from the second image. 

CRITICAL REQUIREMENTS:
- Completely remove ALL existing clothing items (shirts, pants, skirts, etc.)
- The new garment should fit naturally and realistically on the person's body
- Maintain proper proportions and body shape
- Ensure seamless integration with the person's skin and body contours
- Preserve the person's original pose, lighting, and background
- No remnants or artifacts from old clothing should remain
- The new clothing should look like it was naturally worn by the person

QUALITY STANDARDS:
- High resolution and sharp details
- Realistic fabric texture and drape
- Proper fit and sizing
- Natural shadows and lighting on the new garment
- Professional photography quality`

  const negativePrompt = `low quality, blurry, distorted, artifacts, remnants of old clothing, visible seams from old garments, 
mismatched lighting, unrealistic proportions, clothing that doesn't fit properly, 
partial clothing replacement, visible old clothing underneath, poor integration, 
floating clothing, disconnected clothing elements, visible bra straps, underwear showing,
crop top showing midriff when not intended, loose fitting when should be tight,
tight fitting when should be loose, wrong fabric texture, unnatural shadows`

  // Advanced parameters for better results
  const parameters = {
    guidance_scale: 8.0, // Higher guidance for more precise control
    num_inference_steps: 60, // More steps for better quality
    strength: 0.85, // Strong transformation to ensure complete replacement
    seed: Math.floor(Math.random() * 1000000), // Random seed for variety
    scheduler: 'DDIMScheduler', // Better scheduler for clothing
    eta: 0.0, // Deterministic sampling
    clip_skip: 1, // Skip last layer for better prompt adherence
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
