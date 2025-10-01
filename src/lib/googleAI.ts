import sharp from 'sharp'
// Google AI Studio API integration for image generation and editing

export interface GoogleAIRequest {
  personImage?: string; // Base64 image of person
  clothingImage?: string; // Base64 image of clothing
  prompt?: string; // Text prompt for generation
  isTextToImage?: boolean; // If true, generate from text only
  maskImage?: string; // Optional binary mask (white=edit)
}

export interface GoogleAIResponse {
  success: boolean;
  resultImage?: string; // Base64 result image
  error?: string;
  processingTime?: string;
}

export async function generateImageFromText(prompt: string): Promise<GoogleAIResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const modelName = 'gemini-2.5-flash-image-preview';
    const headers: HeadersInit = { 'x-goog-api-key': apiKey as string, 'Content-Type': 'application/json' };

    const postOnce = async (includeGenConfig: boolean) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt }
              ]
            }
          ],
          ...(includeGenConfig ? { generationConfig: { responseMimeType: 'image/png' } } : {})
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    };

    // Try without generationConfig first to avoid API rejection round-trip
    let response = await postOnce(false);
    if (!response.ok) {
      const errText = await response.text();
      // Retry WITH generationConfig only if API requires explicit mime type
      if (errText.includes('response_mime_type') || errText.includes('response mime')) {
        response = await postOnce(true);
      } else {
        throw new Error(`Google AI API error: ${response.status} - ${errText}`);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    try {
      if (process.env.NODE_ENV !== 'production') {
        const first = data?.candidates?.[0];
        console.log('🟡 Gemini(text) first candidate keys:', first ? Object.keys(first) : 'none');
        const parts = first?.content?.parts || first?.parts || [];
        console.log('🟡 Gemini(text) parts summary:', parts.map((p: any) => Object.keys(p)));
      }
    } catch {}

    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      const parts = candidate.content?.parts || candidate?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return { success: true, resultImage: `data:${mimeType};base64,${part.inlineData.data}`, processingTime: '0s' };
        }
        if (part.text && part.text.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(part.text)) {
          return { success: true, resultImage: `data:image/png;base64,${part.text}`, processingTime: '0s' };
        }
      }
    }

    const searchForBase64 = (obj: any): string | null => {
      if (typeof obj === 'string' && obj.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(obj)) return obj;
      if (typeof obj === 'object' && obj) {
        for (const k in obj) {
          const r = searchForBase64(obj[k]);
          if (r) return r;
        }
      }
      return null;
    };
    const found = searchForBase64(data);
    if (found) return { success: true, resultImage: `data:image/png;base64,${found}`, processingTime: '0s' };

    throw new Error('No image data found in Google AI response');
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function editImageWithText(personImage: string, clothingImage: string, prompt: string, maskImage?: string): Promise<GoogleAIResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const personBase64 = personImage.includes(',') ? personImage.split(',')[1] : personImage;
    const clothingBase64 = clothingImage.includes(',') ? clothingImage.split(',')[1] : clothingImage;

    const modelName = 'gemini-2.5-flash-image-preview';
    const headers: HeadersInit = { 'x-goog-api-key': apiKey as string, 'Content-Type': 'application/json' };

    const postOnce = async (includeGenConfig: boolean) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: maskImage ? `${prompt} Use the third image as a binary mask (white = editable area). Only modify the white region.` : prompt },
                { inlineData: { mimeType: 'image/jpeg', data: personBase64 } },
                { inlineData: { mimeType: 'image/jpeg', data: clothingBase64 } },
                ...(maskImage ? [{ inlineData: { mimeType: 'image/png', data: (maskImage.includes(',') ? maskImage.split(',')[1] : maskImage) } }] : [])
              ]
            }
          ],
          ...(includeGenConfig ? { generationConfig: { responseMimeType: 'image/png' } } : {})
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res;
    };

    // Try without generationConfig first
    let response = await postOnce(false);
    if (!response.ok) {
      const errText = await response.text();
      if (errText.includes('response_mime_type') || errText.includes('response mime')) {
        response = await postOnce(true);
      } else {
        throw new Error(`Google AI API error: ${response.status} - ${errText}`);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    try {
      if (process.env.NODE_ENV !== 'production') {
        const first = data?.candidates?.[0];
        console.log('🟡 Gemini(edit) first candidate keys:', first ? Object.keys(first) : 'none');
        const parts = first?.content?.parts || first?.parts || [];
        console.log('🟡 Gemini(edit) parts summary:', parts.map((p: any) => Object.keys(p)));
      }
    } catch {}
    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      const parts = candidate.content?.parts || candidate?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return { success: true, resultImage: `data:${mimeType};base64,${part.inlineData.data}`, processingTime: '0s' };
        }
      }
    }
    throw new Error('No image data found in Google AI response');
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function callGoogleAI(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    if (request.isTextToImage && request.prompt) return generateImageFromText(request.prompt);
    if (request.personImage && request.clothingImage) {
      const prompt = request.prompt || 'Replace clothing in image 1 with garment from image 2. Keep face, body, pose identical.';
      return editImageWithText(request.personImage, request.clothingImage, prompt, request.maskImage);
    }
    throw new Error('Invalid request: missing required parameters');
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Generate a simple torso mask (white rectangle over chest/torso) from a base64 data URL
export async function generateTorsoMask(base64DataUrl: string): Promise<string> {
  const base64 = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl
  const buffer = Buffer.from(base64, 'base64')
  const meta = await sharp(buffer).metadata()
  const width = meta.width || 512
  const height = meta.height || 768

  // Define a central rectangle for torso (tunable ratios)
  const rectX = Math.floor(width * 0.18)
  const rectY = Math.floor(height * 0.20)
  const rectW = Math.floor(width * 0.64)
  const rectH = Math.floor(height * 0.55)

  // Create black background
  const black = await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } } as any)
    .png()
    .toBuffer()

  // Create white rectangle
  const whiteRect = await sharp({ create: { width: rectW, height: rectH, channels: 3, background: { r: 255, g: 255, b: 255 } } } as any)
    .png()
    .toBuffer()

  // Composite
  const composed = await sharp(black)
    .composite([{ input: whiteRect, left: rectX, top: rectY }])
    .png()
    .toBuffer()

  const resultBase64 = composed.toString('base64')
  return `data:image/png;base64,${resultBase64}`
}


