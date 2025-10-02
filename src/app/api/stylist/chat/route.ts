import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { classifyIntent } from '../../../../lib/nlu'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const VECTOR_MATCH_COUNT = 2
const MAX_PRODUCT_CARDS = 2

// Fast intent classification for prompt selection
function classifyPromptType(message: string, nlu: any): string {
  const msgLower = message.toLowerCase()
  
  // Greeting patterns
  if (/^(hi|hello|chào|xin chào|hey|good morning|good afternoon|good evening)/.test(msgLower)) {
    return 'greeting'
  }
  
  // Profile/personal info questions
  if (/(chiều cao|cân nặng|height|weight|thông tin|profile|size|kích thước)/.test(msgLower)) {
    return 'size_help'
  }
  
  // Service information requests
  if (/(bạn có thể làm gì|what can you do|dịch vụ|service|help|giúp đỡ|tư vấn)/.test(msgLower)) {
    return 'service_info'
  }
  
  // Women's products
  if (/(nữ|women|female|đàn bà|con gái|áo nữ|quần nữ)/.test(msgLower)) {
    return 'women_products'
  }
  
  // Budget/price questions
  if (/(giá|price|budget|ngân sách|tiền|cost|expensive|cheap|rẻ|đắt)/.test(msgLower)) {
    return 'budget_help'
  }
  
  // Size questions
  if (/(size|kích thước|vừa|fit|nhỏ|to|lớn|nhỏ|M|L|XL|S)/.test(msgLower)) {
    return 'size_help'
  }
  
  // Color coordination
  if (/(màu|color|phối màu|color coordination|kết hợp màu)/.test(msgLower)) {
    return 'color_help'
  }
  
  // Fit and sizing
  if (/(vừa|fit|kích thước|measurement|đo|body type|dáng người)/.test(msgLower)) {
    return 'fit_advice'
  }
  
  // Occasion-based
  if (/(đi làm|work|office|công sở|đi chơi|casual|formal|thể thao|sport|du lịch|travel)/.test(msgLower)) {
    return 'occasion_outfit'
  }
  
  // Wardrobe building
  if (/(tủ đồ|wardrobe|build|xây dựng|essential|cơ bản|missing|thiếu)/.test(msgLower)) {
    return 'wardrobe_building'
  }
  
  // Seasonal
  if (/(mùa|season|thời tiết|weather|nóng|lạnh|mưa|nắng)/.test(msgLower)) {
    return 'seasonal_style'
  }
  
  // Brand/quality
  if (/(thương hiệu|brand|chất lượng|quality|bền|durable|material|chất liệu)/.test(msgLower)) {
    return 'brand_quality'
  }
  
  // Care instructions
  if (/(giặt|wash|care|bảo quản|maintenance|chăm sóc)/.test(msgLower)) {
    return 'care_instructions'
  }
  
  // Product search intent
  if (nlu.intent === 'product_search' || /(tìm|find|mua|buy|gợi ý|suggest|recommend|chọn|choose)/.test(msgLower)) {
    return 'product_search'
  }
  
  // Style consultation without products
  if (/(phong cách|style|fashion|thời trang|outfit|trang phục)/.test(msgLower) && 
      !/(tìm|find|mua|buy|gợi ý|suggest)/.test(msgLower)) {
    return 'style_consultation'
  }
  
  return 'default'
}

async function determineIfShouldSuggestProducts(message: string, nlu: any): Promise<boolean> {
  try {
    // Fast decision with reduced tokens and timeout
    const response = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze if user wants product recommendations. Answer "YES" or "NO" only.

SUGGEST products for: clothing requests, shopping, outfit help
DON'T suggest for: greetings, service questions, general info

Examples:
- "hi" → NO
- "find jeans" → YES
- "what can you do?" → NO
- "áo ấm" → YES`
          },
          {
            role: 'user',
            content: `"${message}"`
          }
        ],
        max_tokens: 5,
        temperature: 0.1
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ])

    const decision = response.choices[0]?.message?.content?.trim().toUpperCase()
    console.log('🟢 AI Decision result:', decision)
    
    return decision === 'YES'
  } catch (error) {
    console.error('❌ Error in determineIfShouldSuggestProducts:', error)
    // Fast fallback
    const msgLower = message.toLowerCase()
    return /(áo|quần|shirt|pants|jeans|polo|khoác|jacket|tìm|find|mua|buy|gợi ý|suggest)/.test(msgLower)
  }
}

// AI-powered keyword analysis for better product matching
async function analyzeKeywordsWithAI(message: string): Promise<{
  garmentType: string
  keywords: string[]
  filters: {
    category?: string
    season?: string
    style?: string
    color?: string
    price?: { min?: number; max?: number }
  }
}> {
  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a fashion keyword analyzer. Analyze user's clothing request and extract relevant information for database search.

Return a JSON object with this structure:
{
  "garmentType": "main garment type (shirt, pants, jacket, etc.)",
  "keywords": ["array", "of", "search", "keywords"],
  "filters": {
    "category": "specific category if mentioned",
    "season": "winter/summer/spring/fall if mentioned",
    "style": "casual/formal/sporty if mentioned", 
    "color": "color if mentioned",
    "price": {"min": number, "max": number} if mentioned
  }
}

Examples:
- "áo ấm" → {"garmentType": "shirt", "keywords": ["len", "sweater", "hoodie", "ao am"], "filters": {"season": "winter"}}
- "quần jean ngắn" → {"garmentType": "pants", "keywords": ["jean", "short", "quan ngan"], "filters": {"category": "jeans"}}
- "áo khoác dưới 500k" → {"garmentType": "jacket", "keywords": ["khoac", "jacket"], "filters": {"price": {"max": 500000}}}`,
          },
          {
            role: 'user',
            content: `Analyze this request: "${message}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ])

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('No response from AI')
    
    const parsed = JSON.parse(content)
    console.log('🤖 AI Keyword Analysis:', parsed)
    
    return parsed
  } catch (error) {
    console.error('❌ Error in analyzeKeywordsWithAI:', error)
    // Fallback to simple keyword extraction
    const keywords = extractGarmentKeywords(message)
    return {
      garmentType: 'unknown',
      keywords,
      filters: {}
    }
  }
}

// Lightweight helpers to improve matching quality
const normalizeVi = (str: string) => {
  try {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  } catch {
    return String(str || '').toLowerCase()
  }
}

const extractGarmentKeywords = (text: string): string[] => {
  const t = normalizeVi(text)
  const kws: string[] = []
  const add = (k: string) => { if (!kws.includes(k)) kws.push(k) }

  // Winter/seasonal keywords
  if (/mua\s*dong|dong|winter|lanh|am|ao\s*am|len|sweater|hoodie/.test(t)) {
    add('winter')
    add('len')
    add('hoodie')
    add('sweater')
    add('ao am') // Add specific keyword for "áo ấm"
  }
  
  // Jacket keywords (separate from winter)
  if (/ao\s*khoac|\bkhoac\b|jacket|windbreaker|gio\b|puffer|phao/.test(t)) {
    add('khoac')
  }
  
  // Summer keywords
  if (/mua\s*he|he|summer|nong|ao\s*thun|\btee\b|tshirt|short|quan\s*short/.test(t)) {
    add('summer')
    add('thun')
  }
  
  // General garment keywords (already handled above)
  if (/hoodie|sweater|\blen\b/.test(t)) add('hoodie')
  if (/so\s*mi|\bsomi\b/.test(t)) add('so mi')
  if (/\bpolo\b/.test(t)) add('polo')
  if (/ao\s*thun|\btee\b|tshirt/.test(t)) add('thun')
  
  // Jeans keywords
  if (/jean|quan\s*jean|quan\s*bo/.test(t)) add('jean')
  if (/quan\s*ngan|ngan|short/.test(t)) add('short')
  if (/quan\s*dai|dai|long/.test(t)) add('dai')

  return kws
}

const keywordMatchesTitle = (title: string, keywords: string[]) => {
  const t = normalizeVi(title)
  return keywords.some((k) => t.includes(k))
}

// Optimized prompt templates for different scenarios
const PROMPT_TEMPLATES = {
  // Quick greeting response
  greeting: `You are a friendly Clothify stylist. Respond naturally in Vietnamese to greetings. If user profile information is provided in the context, use the actual values to personalize your response. For example, if you see "Height: 168cm, Weight: 53kg, Size: L", mention it naturally like "Mình thấy bạn cao 168cm, nặng 53kg, mặc size L". Keep it short and ask how you can help.`,
  
  // General information about services
  service_info: `You are a Clothify service expert. Explain services in Vietnamese: men's fashion consultation, virtual try-on, wardrobe management. Keep response concise.`,
  
  // Product search and recommendations
  product_search: `You are a Clothify stylist. User wants product recommendations. 
- Clothify ONLY has MEN'S CLOTHING
- Use user profile information (size, style preferences, height, weight) for personalized recommendations
- Mention specific size compatibility: "I see you wear size [X], this product also has your size"
- Reference style preferences: "Based on your [casual/formal] style preference, this would fit perfectly"
- For WINTER requests: Only suggest warm items (jackets, sweaters, hoodies, long sleeves)
- For SUMMER requests: Only suggest light items (t-shirts, polos, shorts)
- For JEANS requests: If user asks for "quần jean ngắn" (short jeans), suggest SHORT jeans, not long jeans
- NEVER suggest inappropriate seasonal items
- Keep response SHORT and CONCISE. Focus on key benefits only.
- MAXIMUM 2 PRODUCTS ONLY for comparison. NEVER SUGGEST MORE THAN 2 PRODUCTS.
- DO NOT include detailed product descriptions, prices, or links in text - let ProductCards handle that.
- DO NOT use ### format or numbered lists with detailed descriptions.
- Keep response under 50 words. Just mention the 2 products briefly and let ProductCards show details.
- DO NOT include any product details, prices, or descriptions in text.
- End with brief styling suggestion or question to continue conversation.`,
  
  // Style consultation without products
  style_consultation: `You are a fashion consultant. User wants style advice without products.
- Focus on color coordination, fit, occasion appropriateness
- Provide practical styling tips
- Ask about specific needs if unclear`,
  
  // Women's product inquiry
  women_products: `You are a Clothify representative. User asks about women's products.
- Clothify currently ONLY has MEN'S CLOTHING
- Politely explain the limitation
- Suggest alternatives or future updates`,
  
  // Price/budget questions
  budget_help: `You are a Clothify stylist. User has budget constraints.
- Ask for specific budget range: [<200k | 200-400k | 400-700k | >700k]
- Provide value-focused recommendations
- Explain cost-benefit of quality items`,
  
  // Size and fit questions
  size_help: `You are a Clothify stylist. User needs size guidance. If user profile information is provided in the context, use the actual values to personalize your response. For example, if you see "Height: 168cm, Weight: 53kg, Size: L", mention it naturally like "Mình thấy bạn cao 168cm, nặng 53kg, size L sẽ phù hợp với bạn".
- Provide fit recommendations based on body type
- Explain size charts and measurements`,
  
  // Occasion-based recommendations
  occasion_style: `You are a Clothify stylist. User needs outfit for specific occasion.
- Ask about occasion: [work | casual | formal | sport | travel]
- Provide appropriate style suggestions
- Consider dress code requirements`,
  
  // Color coordination help
  color_help: `You are a Clothify stylist. User needs color coordination advice.
- Use user's favorite colors from profile
- Suggest color combinations that work well
- Consider skin tone and personal style
- Provide specific color pairing examples`,
  
  // Fit and sizing questions
  fit_advice: `You are a Clothify stylist. User needs fit advice.
- Use user's height, weight, and current size from profile
- Explain how different fits work with their body type
- Suggest size adjustments if needed
- Provide measurement guidance`,
  
  // Occasion-specific styling
  occasion_outfit: `You are a Clothify stylist. User needs outfit for specific occasion.
- Use user's style preferences and body measurements
- Consider the occasion requirements
- Suggest complete outfit combinations
- Include accessories and styling tips`,
  
  // Wardrobe building
  wardrobe_building: `You are a Clothify stylist. User wants to build their wardrobe.
- Analyze user's current style preferences
- Suggest essential pieces they're missing
- Create a cohesive wardrobe plan
- Prioritize versatile items`,
  
  // Seasonal recommendations
  seasonal_style: `You are a Clothify stylist. User needs seasonal clothing advice.
- Consider current season and weather
- Use user's style preferences
- For WINTER: Suggest warm items like jackets, sweaters, hoodies, long sleeves
- For SUMMER: Suggest light items like t-shirts, polos, shorts
- Suggest appropriate fabrics and colors
- Provide layering advice
- NEVER suggest inappropriate seasonal items (e.g., shorts in winter, jackets in summer)`,
  
  // Brand and quality questions
  brand_quality: `You are a Clothify stylist. User asks about brands or quality.
- Explain Clothify's quality standards
- Compare different product lines
- Focus on value and durability
- Mention care instructions`,
  
  // Care and maintenance
  care_instructions: `You are a Clothify stylist. User needs care advice.
- Provide specific care instructions
- Explain fabric care requirements
- Suggest maintenance tips
- Help extend garment life`,
  
  // General fallback
  default: `You are a Clothify stylist. Respond helpfully in Vietnamese. If user profile information is provided in the context, use the actual values to personalize your response. Ask clarifying questions if needed.`
}
const SYSTEM_PROMPT_ONE_AT_A_TIME = `You are a senior stylist and service expert at Clothify.

IMPORTANT INFORMATION:
- Clothify currently ONLY HAS MEN'S CLOTHING
- All products in the system are for men
- If customers ask about women's clothing, inform that Clothify currently only has men's clothing

IMPORTANT PRINCIPLES:
- Always speak Vietnamese with proper accents, naturally and friendly.
- ONLY suggest products when user specifically requests (search, buy, introduce, need to buy).
- DO NOT automatically provide products when just greeting, asking general information or style consultation.
- When information is unclear (budget, occasion, style, color, fit), ask back but ONE-AT-A-TIME:
  * Each turn ask MAXIMUM 1 short question.
  * Priority order: occasion > weather/season > style.
  * Include 3-5 short options in square brackets, separated by |, example: [casual | formal | sporty].
  * Avoid asking multiple questions in one turn.
- Only provide products if have suitable information; if lacking data, clearly state checking for more.
- Each product with reason for suitability (material, fit, occasion, function) + link + reference price.
- STRICTLY SUGGEST MAXIMUM 2 PRODUCTS ONLY. DO NOT SUGGEST 3 OR 4 PRODUCTS UNDER ANY CIRCUMSTANCES.
- DO NOT use ### format or numbered lists with detailed descriptions.
- Keep response under 50 words. Just mention the 2 products briefly and let ProductCards show details.
- DO NOT include any product details, prices, or descriptions in text.
- Absolutely do not fabricate inventory/promotional information without verified data.
- When appropriate, subtly suggest Clothify services (virtual try-on "Try Now", booking, wardrobe management, size updates).
- End with open question to continue.

Response structure:
- Style consultation: analyze needs and provide specific solutions for men.
- Product suggestions: only when user specifically requests, list MAXIMUM 2 PRODUCTS ONLY from context. NEVER suggest 3 or 4 products.
- DO NOT use ### format or numbered lists with detailed descriptions.
- Keep response under 50 words. Just mention the 2 products briefly and let ProductCards show details.
- DO NOT include any product details, prices, or descriptions in text.
- Clothify services: suggest actions (virtual try-on, booking, information updates, wardrobe suggestions) to continue support.`

const formatCurrency = (value: number) => {
  try {
    return new Intl.NumberFormat('vi-VN').format(value) + '?'
  } catch {
    return `${value}?`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'Missing message content' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    // Use fast regex-based intent detection to reduce latency
    const nlu = classifyIntent(message)
    const promptType = classifyPromptType(message, nlu)
    // AI-driven decision for product suggestions (optimized)
    const shouldSuggestProducts = await determineIfShouldSuggestProducts(message, nlu)
    
    console.log('🟢 API Intent Detection:', { message, intent: nlu.intent, confidence: nlu.confidence, promptType, shouldSuggestProducts })

    let vectorMatches: any[] = []
    let productScores = new Map<number, number>()
    let productChunks = new Map<number, string[]>()
    let products: any[] = []

    // Best-effort: attach user onboarding profile to context if available
    let profileContext = ''
    let wardrobeContext = ''
    try {
      const authHeader = request.headers.get('authorization')
      console.log('🔍 Auth Header:', authHeader ? 'Present' : 'Missing')
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
        console.log('🔍 User Auth:', { userId: user?.id, error: authErr?.message })
        
        if (!authErr && user) {
          // Get user profile - bypass RLS with admin client
          const { data: prof, error: profErr } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          console.log('🔍 Profile Query:', { userId: user.id, prof, error: profErr?.message })
          
          if (prof) {
            const h = prof.height_cm ? `${prof.height_cm}cm` : 'unknown'
            const w = prof.weight_kg ? `${prof.weight_kg}kg` : 'unknown'
            const s = prof.size || 'unknown'
            const styles = Array.isArray(prof.style_preferences) && prof.style_preferences.length ? prof.style_preferences.join(', ') : 'unknown'
            const colors = Array.isArray(prof.favorite_colors) && prof.favorite_colors.length ? prof.favorite_colors.join(', ') : 'unknown'
            const occasions = Array.isArray(prof.occasions) && prof.occasions.length ? prof.occasions.join(', ') : 'unknown'
            profileContext = `USER_PROFILE:\n- Height: ${h}\n- Weight: ${w}\n- Size: ${s}\n- Style Preferences: ${styles}\n- Favorite Colors: ${colors}\n- Occasions: ${occasions}\n\nUse this information for personalized recommendations. Mention specific details like "I see you wear size ${s}" or "Based on your ${styles} style preference".`
            console.log('🔍 Profile Context Created:', profileContext)
          } else {
            console.log('❌ No profile found for user:', user.id)
          }

          // Get user's wardrobe items for context
          const { data: wardrobeItems } = await supabaseAdmin
            .from('user_wardrobe_items')
            .select('title, category, color, style_tags, occasion_tags, ai_notes')
            .eq('user_id', user.id)
            .order('added_at', { ascending: false })
            .limit(10)

          if (wardrobeItems && wardrobeItems.length > 0) {
            const wardrobeSummary = wardrobeItems.map(item => 
              `- ${item.title} (${item.category}, ${item.color}) - ${item.style_tags?.join(', ') || 'no style tags'}`
            ).join('\n')
            
            wardrobeContext = `USER_WARDROBE:\n${wardrobeSummary}\n\nWhen making recommendations, consider what the user already has in their wardrobe. Suggest items that complement their existing pieces or fill gaps in their collection.`
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching profile/wardrobe:', error)
    }

    // Only search for products if user explicitly asks for them
    if (shouldSuggestProducts) {
      // 0) AI-powered keyword analysis for better matching
      const aiAnalysis = await analyzeKeywordsWithAI(message)
      console.log('🤖 AI Analysis result:', aiAnalysis)
      
      // 1) Vector search via RPC (with timeout) - OPTIMIZED
      const embeddingResponse = await Promise.race([
        openai.embeddings.create({ model: 'text-embedding-3-small', input: message }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('embed-timeout')), 3000)), // Reduced from 7s to 3s
      ])
      const { data: matches, error: vectorError } = await supabaseAdmin.rpc('match_products', {
        query_embedding: embeddingResponse.data[0].embedding,
        match_count: 2, // Force limit to 2 products
      })
      if (vectorError) throw new Error(`Vector search error: ${vectorError.message}`)
      vectorMatches = matches || []

      ;(vectorMatches ?? []).forEach((match: any, index: number) => {
        const boost = 1000 - index * 5
        productScores.set(match.product_id, Math.max(productScores.get(match.product_id) ?? 0, boost))
        productChunks.set(match.product_id, [ ...(productChunks.get(match.product_id) ?? []), match.content ])
      })

      const orderedProductIds = Array.from(productScores.entries()).sort((a, b) => b[1] - a[1]).map(([id]) => id)
      const chosenProductIds = orderedProductIds.slice(0, 2) // Force limit to 2 products

      const { data: fetchedProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id,title,price,url,image,gallery,style,occasion,match_with,why_recommend,variants,search_booster,description_text,tags')
        .in('id', chosenProductIds)
      if (productsError) throw new Error(`Fetch products error: ${productsError.message}`)

      products = fetchedProducts || []

      // 2) AI-enhanced keyword/price filtering to refine or fallback
      const keywords = aiAnalysis.keywords.length > 0 ? aiAnalysis.keywords : extractGarmentKeywords(message)
      const maxPrice = aiAnalysis.filters.price?.max || (typeof nlu.entities?.price === 'number' ? nlu.entities.price : undefined)

      console.log('🔍 AI Keywords:', aiAnalysis.keywords, 'Fallback keywords:', extractGarmentKeywords(message), 'for message:', message)

      if (keywords.length > 0 || typeof maxPrice === 'number') {
        let q = supabaseAdmin
          .from('products')
          .select('id,title,price,url,image,gallery,style,occasion,match_with,why_recommend,variants,search_booster,description_text,tags')
          .limit(2) // Force limit to 2 products

        if (keywords.length > 0) {
          const ors: string[] = []
          for (const k of keywords) {
            ors.push(`title.ilike.%${k}%`)
            ors.push(`search_booster.ilike.%${k}%`)
            ors.push(`description_text.ilike.%${k}%`)
          }
          if (ors.length) q = q.or(ors.join(','))
          
          // AI-powered garment type filtering
          if (aiAnalysis.garmentType) {
            switch (aiAnalysis.garmentType) {
              case 'shirt':
                // Only show shirts, sweaters, hoodies - not pants
                q = q.or('title.ilike.%ao%,title.ilike.%len%,title.ilike.%sweater%,title.ilike.%hoodie%,title.ilike.%polo%,title.ilike.%so mi%')
                q = q.not('title.ilike.%quan%', 'and', 'title')
                q = q.not('title.ilike.%pants%', 'and', 'title')
                break
              case 'pants':
                // Only show pants - not shirts
                q = q.or('title.ilike.%quan%,title.ilike.%pants%,title.ilike.%jean%')
                q = q.not('title.ilike.%ao%', 'and', 'title')
                q = q.not('title.ilike.%shirt%', 'and', 'title')
                break
              case 'jacket':
                // Only show jackets, coats - not shirts or pants
                q = q.or('title.ilike.%khoac%,title.ilike.%jacket%,title.ilike.%coat%,title.ilike.%blazer%')
                q = q.not('title.ilike.%ao thun%', 'and', 'title')
                q = q.not('title.ilike.%polo%', 'and', 'title')
                q = q.not('title.ilike.%quan%', 'and', 'title')
                break
            }
          }
          
          // Specific filtering for "áo ấm" requests (fallback)
          if (keywords.includes('ao am') || keywords.includes('len') || keywords.includes('sweater') || keywords.includes('hoodie')) {
            // Only show warm clothing, not pants
            q = q.or('title.ilike.%len%,title.ilike.%sweater%,title.ilike.%hoodie%,title.ilike.%ao am%,title.ilike.%khoac%,title.ilike.%jacket%')
            q = q.not('title.ilike.%quan%', 'and', 'title')
            q = q.not('title.ilike.%pants%', 'and', 'title')
            q = q.not('description_text.ilike.%quan%', 'and', 'description_text')
            q = q.not('description_text.ilike.%pants%', 'and', 'description_text')
          }
          
          // AI-powered seasonal filtering
          if (aiAnalysis.filters.season) {
            switch (aiAnalysis.filters.season) {
              case 'winter':
                // Exclude summer items for winter
                q = q.not('title.ilike.%short%', 'and', 'title')
                q = q.not('title.ilike.%tee%', 'and', 'title')
                q = q.not('title.ilike.%thun%', 'and', 'title')
                q = q.not('description_text.ilike.%short%', 'and', 'description_text')
                q = q.not('description_text.ilike.%tee%', 'and', 'description_text')
                q = q.not('description_text.ilike.%thun%', 'and', 'description_text')
                break
              case 'summer':
                // Exclude winter items for summer
                q = q.not('title.ilike.%len%', 'and', 'title')
                q = q.not('title.ilike.%sweater%', 'and', 'title')
                q = q.not('title.ilike.%hoodie%', 'and', 'title')
                q = q.not('title.ilike.%khoac%', 'and', 'title')
                q = q.not('description_text.ilike.%len%', 'and', 'description_text')
                q = q.not('description_text.ilike.%sweater%', 'and', 'description_text')
                q = q.not('description_text.ilike.%hoodie%', 'and', 'description_text')
                break
            }
          }
          
          // Fallback seasonal filtering
          if (keywords.includes('winter')) {
            // Exclude summer items for winter
            q = q.not('title.ilike.%short%', 'and', 'title')
            q = q.not('title.ilike.%tee%', 'and', 'title')
            q = q.not('title.ilike.%thun%', 'and', 'title')
            q = q.not('title.ilike.%so mi%', 'and', 'title')
            q = q.not('title.ilike.%somi%', 'and', 'title')
            q = q.not('description_text.ilike.%short%', 'and', 'description_text')
            q = q.not('description_text.ilike.%tee%', 'and', 'description_text')
            q = q.not('description_text.ilike.%thun%', 'and', 'description_text')
          }
          if (keywords.includes('summer')) {
            // Exclude winter items for summer
            q = q.not('title.ilike.%len%', 'and', 'title')
            q = q.not('title.ilike.%khoac%', 'and', 'title')
            q = q.not('title.ilike.%jacket%', 'and', 'title')
            q = q.not('description_text.ilike.%len%', 'and', 'description_text')
          }
          
          // Jeans length filtering
          if (keywords.includes('short')) {
            // For short jeans requests, prioritize short jeans
            q = q.or('title.ilike.%short%,description_text.ilike.%short%')
          }
          if (keywords.includes('dai')) {
            // For long jeans requests, prioritize long jeans
            q = q.not('title.ilike.%short%', 'and', 'title')
            q = q.not('description_text.ilike.%short%', 'and', 'description_text')
          }
        }
        // AI-powered price filtering
        if (aiAnalysis.filters.price) {
          if (aiAnalysis.filters.price.min) {
            q = q.gte('price', aiAnalysis.filters.price.min)
          }
          if (aiAnalysis.filters.price.max) {
            q = q.lte('price', aiAnalysis.filters.price.max)
          }
        } else if (typeof maxPrice === 'number') {
          q = q.lte('price', maxPrice)
        }

        const { data: kwProducts, error: kwErr } = await q
        if (!kwErr && Array.isArray(kwProducts)) {
          // Client-side occasion mapping and filtering
          const occRaw = (nlu.entities?.occasion ?? '').toString().toLowerCase()
          const occCandidates: string[] = (() => {
            if (!occRaw) return []
            const norm = occRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            if (/(phuot)/.test(norm)) return ['du lich', 'di choi']
            if (/(di lam|cong so)/.test(norm)) return ['di lam', 'cong so']
            if (/(di choi|dao pho|cafe)/.test(norm)) return ['di choi']
            if (/(di hoc|den truong)/.test(norm)) return ['di hoc']
            return []
          })()

          const filtered = occCandidates.length
            ? (kwProducts as any[]).filter((p) => {
                const arr = Array.isArray(p.occasion) ? p.occasion.map((x: any) => String(x).toLowerCase()) : []
                return occCandidates.some((o) => arr.includes(o))
              })
            : kwProducts

          for (const p of filtered) {
            if (!productScores.has(p.id)) productScores.set(p.id, 600)
          }
          const merged = new Map<number, any>()
          for (const p of [...products, ...(filtered || [])]) merged.set(p.id, p)
          products = Array.from(merged.values())

          // Small boost if title matches garment keyword
          for (const p of products) {
            if (keywordMatchesTitle(p.title || '', keywords)) {
              productScores.set(p.id, (productScores.get(p.id) ?? 0) + 50)
            }
          }
        }
      }

      // Sort by combined score and keep top set
      products.sort((a, b) => (productScores.get(b.id) ?? 0) - (productScores.get(a.id) ?? 0))
      products = products.slice(0, 2) // Force limit to 2 products
    }

    const contextSections: string[] = []
    for (const product of products) {
      const chunks = productChunks.get(product.id) ?? []
      const context = chunks.slice(0, 1).join('\n\n') // Reduced from 3 to 1 chunk for speed
      contextSections.push(
        `[SP ${product.id}] ${product.title}\nPrice: ${formatCurrency(product.price)}\nStyle: ${product.style?.join(', ') || 'versatile'} ; Occasion: ${product.occasion?.join(', ') || 'versatile'}\nLink: ${product.url}\n${context}`
      )
    }

    const contextBlock = shouldSuggestProducts 
      ? (contextSections.join('\n\n---\n\n') || 'No suitable products found in database.')
      : 'Not searching products as this is not a product request.'

    // Add extracted entities to context (safe and concise)
    const entitiesInfo = Object.keys(nlu.entities || {}).length > 0
      ? `\n\nEntities: ${JSON.stringify(nlu.entities)}`
      : ''
    const priceKnown = typeof (nlu.entities as any)?.price === 'number' ? (nlu.entities as any).price : 'unknown'
    const sizeKnown = (nlu.entities as any)?.size || 'unknown'
    const entitiesInfoExtended = `${entitiesInfo}\n\nCURRENT INFORMATION:\n- Budget: ${priceKnown}\n- Size: ${sizeKnown}\n\nRULE: If missing budget or size, ask with 1 short question with suggestions: [<200k | 200-400k | 400-700k | >700k] and [S | M | L | XL].`
    const bodyContext = Array.isArray((body as any).context) ? (body as any).context : []
    const summary = typeof (body as any).summary === 'string' ? (body as any).summary.trim() : ''
    // Select optimized prompt based on intent
    const selectedPrompt = PROMPT_TEMPLATES[promptType as keyof typeof PROMPT_TEMPLATES] || PROMPT_TEMPLATES.default

    console.log('🔍 Chat Messages Context:', { 
      selectedPrompt: selectedPrompt.substring(0, 100) + '...', 
      hasProfileContext: !!profileContext,
      profileContext: profileContext.substring(0, 200) + '...',
      hasWardrobeContext: !!wardrobeContext 
    })

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: selectedPrompt },
      ...(profileContext ? [{ role: 'system', content: profileContext } as const] : []),
      ...(wardrobeContext ? [{ role: 'system', content: wardrobeContext } as const] : []),
      ...(summary ? [{ role: 'system', content: `Conversation summary: ${summary}` } as const] : []),
      ...bodyContext
        .filter((m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
        .slice(-15), // Reduced from 20 to 8 messages for speed
      {
        role: 'user',
        content: shouldSuggestProducts 
          ? `Customer asks: "${message}"\n\nPRODUCT CONTEXT:\n${contextBlock}\n\nProvide detailed product recommendation with styling advice. Consider their existing wardrobe when making suggestions.`
          : `Customer asks: "${message}"\n\nProvide helpful response without product suggestions. Consider their existing wardrobe when giving advice. If you have wardrobe access, use it proactively instead of asking about it.`
      }
    ]

    // Optional streaming (faster first token)
    const wantStream = request.headers.get('x-stream') === '1'
    if (wantStream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start: async (controller) => {
          try {
            const streamed = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.8,
              messages: chatMessages,
              max_tokens: promptType === 'greeting' ? 100 : promptType === 'service_info' ? 150 : 200, // Reduced tokens for speed
              stream: true
            })

            for await (const part of streamed) {
              const token = part.choices?.[0]?.delta?.content
              if (token) controller.enqueue(encoder.encode(token))
            }
            controller.close()
          } catch (e) {
            controller.enqueue(encoder.encode('\n'))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no'
        }
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: chatMessages,
      max_tokens: promptType === 'greeting' ? 100 : promptType === 'service_info' ? 150 : 200 // Reduced tokens for speed
    })

    const answer = completion.choices[0]?.message?.content?.trim() 

    // Only return products if it was a product request AND we have valid products
    let productCards: any[] = []
    
    if (shouldSuggestProducts && products.length > 0) {
      console.log('🟢 Found products:', products.length, 'for request:', message)
      type ProductRow = NonNullable<typeof products>[number]
      const productMap = new Map<number, ProductRow>()
      products.forEach((row) => productMap.set(row.id, row as ProductRow))

      const orderedProductIds = Array.from(productScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)

      productCards = orderedProductIds
        .map((id) => productMap.get(id))
        .filter((item): item is ProductRow => Boolean(item))
        .slice(0, MAX_PRODUCT_CARDS)
        .map((product) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          url: product.url,
          image: product.image,
          gallery: product.gallery,
          style: product.style,
          occasion: product.occasion,
          match_with: product.match_with,
          why_recommend: product.why_recommend,
          variants: product.variants
        }))
    } else {
      console.log('🔴 No products to return. shouldSuggestProducts:', shouldSuggestProducts, 'products.length:', products.length)
    }

      return NextResponse.json({ 
        answer, 
        products: productCards.slice(0, 2) // Ensure only 2 products
      })
  } catch (error) {
    console.error('[stylist/chat] error', error)
    return NextResponse.json({ error: 'Cannot process request at this time' }, { status: 500 })
  }
}
