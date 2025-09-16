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
  // Simplified prompt for better performance
  const basePrompt = `Virtual try-on: Replace person's clothing with new garment. Remove old clothing completely, maintain natural fit and proportions, preserve pose and lighting.`

  const negativePrompt = `low quality, blurry, distorted, artifacts, old clothing remnants, poor fit, unnatural shadows`

  // Optimized parameters for better performance
  const parameters = {
    guidance_scale: 7.0, // Balanced guidance
    num_inference_steps: 40, // Reduced steps for faster processing
    strength: 0.8, // Strong transformation
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
