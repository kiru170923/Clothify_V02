'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSupabase } from './SupabaseProvider'
import { supabase } from '../lib/supabase'

// Generate unique message ID
let messageIdCounter = 0
const generateMessageId = () => {
  messageIdCounter++
  return `${Date.now()}-${messageIdCounter}-${Math.random().toString(36).substring(2, 11)}`
}

// Debounce timer (browser-safe)
let searchTimeout: number | undefined

import {
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon,
  MicrophoneIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { classifyIntent, classifyIntentWithAI } from '../lib/nlu'
import { debounce } from '../lib/debounce'
import { parseResponseJson } from '../lib/parseResponse'
import { useConversationMemory, ConversationContext } from '../lib/conversationMemory'
import { semanticSearchEngine, createSearchFilters } from '../lib/semanticSearch'
import { personalizationEngine } from '../lib/personalizationEngine'
// Removed emotional intelligence for core functionality focus
import { advancedFilteringEngine, createAdvancedFilters } from '../lib/advancedFiltering'
import { ProductCard } from './ProductCard'
import MessageBubble from './ui/MessageBubble'
import TypingIndicator, { TypingIndicatorVariant } from './ui/TypingIndicator'
import ChatInput from './ui/ChatInput'
import ProductCarousel from './ui/ProductCarousel'
import ChatHeader from './ui/ChatHeader'
import MobileChatInput from './ui/MobileChatInput'
import MobileMessageBubble from './ui/MobileMessageBubble'
import { PullToRefresh, BottomSheet, useCompactMode } from './ui/MobileGestures'
import { 
  SmoothScrollToBottom, 
  ReadReceipt,
  MessageStatus,
  NotificationToast,
  PulseAnimation
} from './ui/MicroInteractions'

// Phase 4 Advanced Features
import { useConversationState, ConversationState, UserIntent } from '../lib/conversationStateMachine'
import { useSmartFollowUp, FollowUpContext } from '../lib/smartFollowUp'
import { useAdvancedNLU } from '../lib/advancedNLU'
import { useStyleAnalysis, StyleProfile } from '../lib/styleAnalysisEngine'
import StyleQuiz from './ui/StyleQuiz'
import AnalyticsDashboard from './ui/AnalyticsDashboard'

type ChatActionKind = 'quick-text' | 'service' | 'link' | 'confirm-tryon' | 'cancel'

interface ChatAction {
  id: string
  label: string
  value: string
  kind: ChatActionKind
  autoSend?: boolean
  submitType?: 'search' | 'chat'
  href?: string
}

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  product?: ProductData
  productList?: ProductData[]
  image?: string
  actions?: ChatAction[]
}

interface Variant {
  sku?: string
  color?: string
  size?: string
  price?: number
}

interface ProductData {
  id: number
  name: string
  price: number
  description?: string
  images: string[]
  productUrl?: string
  style?: string[]
  occasion?: string[]
  matchWith?: string[]
  whyRecommend?: string
  variants?: Variant[]
  // optional extra fields used in UI in some places
  originalPrice?: number
  discount?: string
  rating?: number
  reviewCount?: number
  sold?: number
}

const mapProductToCard = (item: any): ProductData => {
  const rawId = item?.id ?? item?.product_id
  const numericId = Number(rawId)
  const resolvedId = Number.isFinite(numericId) ? numericId : Date.now()

  const titleCandidate =
    item?.title ??
    item?.name ??
    item?.normalized?.title ??
    item?.metadata?.title ??
    'San pham'

  const priceCandidate =
    item?.price ??
    item?.normalized?.price ??
    item?.metadata?.price ??
    0

  const toStringArray = (value: any): string[] => {
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
  }

  const gallery = toStringArray(item?.gallery)
  const normalizedImages = toStringArray(item?.normalized?.images)
  const metadataImages = toStringArray(item?.metadata?.images)
  const singleImage = typeof item?.image === 'string' && item.image.trim().length > 0 ? [item.image] : []
  const combinedImages = [
    ...(gallery || []),
    ...(singleImage || []),
    ...(normalizedImages || []),
    ...(metadataImages || []),
  ].filter((src): src is string => typeof src === 'string' && src.trim().length > 0)

  const uniqueImages = Array.from(new Set(combinedImages))
  const variants = Array.isArray(item?.variants) ? item.variants : undefined

  return {
    id: resolvedId,
    name: String(titleCandidate),
    price: Number(priceCandidate) || 0,
    description:
      item?.why_recommend ??
      item?.normalized?.description ??
      item?.metadata?.description ??
      '',
    images: uniqueImages,
    productUrl: item?.url ?? item?.productUrl ?? item?.source_url ?? '',
    style: toStringArray(item?.style ?? item?.normalized?.style),
    occasion: toStringArray(item?.occasion ?? item?.normalized?.occasion),
    matchWith: toStringArray(item?.match_with ?? item?.normalized?.match_with),
    whyRecommend: item?.why_recommend ?? item?.normalized?.why_recommend ?? '',
    variants,
  }
}

// --- Helper: update size API call ---
const updateUserSize = async (newSize: string, token: string) => {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ size: newSize }),
  })
  const data = await parseResponseJson(res)
  if (!res.ok) throw new Error(data.error || 'Cập nhật không thành công')
  return data
}

export default function FashionChatbot() {
  const router = useRouter()
  const { session } = useSupabase() as any
  const SIMPLE_MODE = true
  const ENABLE_ACTIONS = false
  
  // Initialize conversation memory
  const {
    context: conversationContext,
    updateContext,
    getPersonalizedResponse,
    getContextForAI,
    addSearchHistory,
    saveContext,
    loadContext,
    clearContext
  } = useConversationMemory()

  // Phase 4: Advanced Features
  const {
    currentState,
    context: stateContext,
    transition,
    updateCollectedInfo,
    updateUserProfile,
    getStateDescription,
    getSuggestedActions
  } = useConversationState()

  const {
    analyzeMissingInfo,
    generateFollowUpQuestions,
    generateFollowUpMessage,
    generateQuickActions,
    processResponse,
    getCompletionPercentage
  } = useSmartFollowUp()


  const {
    analyzeText,
    extractEntitiesAdvanced
  } = useAdvancedNLU()

  const {
    analyzeStyleProfile,
    analyzeOutfit,
    generateStyleRecommendations
  } = useStyleAnalysis()

  const createAction = (partial: Omit<ChatAction, 'id'>): ChatAction => ({
    id: generateMessageId(),
    ...partial,
  })

  const filterActions = (actions?: ChatAction[]) => {
    if (!actions || actions.length === 0) return undefined
    if (!ENABLE_ACTIONS) return undefined
    if (!SIMPLE_MODE) return actions
    // In simple mode, only keep quick-text actions
    const kept = actions.filter(a => a.kind === 'quick-text')
    return kept.length > 0 ? kept : undefined
  }

  const buildWelcomeMessage = (): Message => ({
    id: generateMessageId(),
    type: 'bot',
    content: 'Chào bạn! Mình là Clothify Stylist AI – chuyên tư vấn trang phục nam. Mình có thể giúp bạn tư vấn phong cách, tìm kiếm sản phẩm phù hợp, hoặc phân tích outfit từ ảnh. Bạn muốn bắt đầu từ đâu nhỉ?',
    timestamp: new Date(),
    actions: filterActions([
      createAction({ label: 'Tư vấn phong cách nam', kind: 'quick-text', value: 'Giúp mình định hình phong cách cá nhân với.' }),
      createAction({ label: 'Tìm sản phẩm nam', kind: 'quick-text', value: 'Mình muốn tìm outfit công sở nam dưới 800k', submitType: 'search', autoSend: true })
    ]),
  })

  // Small helper to make responses feel more natural
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Ensure AI text only mentions first product and is complete
  const normalizeSingleProductAnswer = (text: string): string => {
    try {
      const t = String(text || '')
      // Cut at common "item 2" markers
      const markers = [
        /\n\s*2\./m,
        /\n\s*###\s*2/m,
        /\n\s*-\s*2\./m
      ]
      let cutIdx = -1
      for (const r of markers) {
        const m = t.match(r)
        if (m && m.index !== undefined) {
          cutIdx = cutIdx === -1 ? m.index : Math.min(cutIdx, m.index)
        }
      }
      let out = cutIdx !== -1 ? t.slice(0, cutIdx).trimEnd() : t
      // Ensure sentence ends with punctuation
      if (!/[\.!?…]$/.test(out)) out = out + '.'
      return out
    } catch {
      return text
    }
  }

  // Load messages from memory only (no localStorage for speed)
  const [messages, setMessages] = useState<Message[]>([buildWelcomeMessage()])

  // No localStorage needed - everything in memory for speed
  useEffect(() => {
    loadContext()
  }, [loadContext])

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Phase 4: Advanced Features State
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false)
  const [activeFeature, setActiveFeature] = useState<'quiz' | 'analytics' | null>(null)
  const [followUpContext, setFollowUpContext] = useState<FollowUpContext>({
    missingInfo: [],
    conversationFlow: [],
    userResponses: {},
    currentTopic: '',
    urgency: 'low'
  })

  // Separate effect for follow-up context updates
  useEffect(() => {
    // Update follow-up context when conversation changes
    const missingInfo = analyzeMissingInfo(followUpContext)
    if (missingInfo.length !== followUpContext.missingInfo.length) {
      setFollowUpContext(prev => ({
        ...prev,
        missingInfo
      }))
    }
  }, [followUpContext.conversationFlow.length, Object.keys(followUpContext.userResponses).length, followUpContext.currentTopic])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info' | 'warning'>('info')
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [bottomSheetContent, setBottomSheetContent] = useState<React.ReactNode>(null)
  const [bottomSheetTitle, setBottomSheetTitle] = useState('')
  
  // Mobile optimizations
  const isCompact = useCompactMode()
  const [pendingClarify, setPendingClarify] = useState<
    | null
    | { type: 'price' | 'color' | 'size' | 'occasion' | 'season' | 'material'; originalQuery?: string; entities?: any }
  >(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tryOnLoading, setTryOnLoading] = useState<string | null>(null)
  const [tryOnResults, setTryOnResults] = useState<Map<string, string>>(new Map())
  const [showImageModal, setShowImageModal] = useState<{ url: string; alt: string } | null>(null)
  const [showTryOnConfirmModal, setShowTryOnConfirmModal] = useState<{ 
    productImageUrl: string
    availableTokens: number 
  } | null>(null)
  const [wardrobeAnalysisLoading, setWardrobeAnalysisLoading] = useState(false)
  const [userModelImage, setUserModelImage] = useState<string | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isSubmittingRef = useRef(false)

  // Helper function to load model from My Models
  const loadModelFromMyModels = async (accessToken: string) => {
    try {
      console.log('🔄 Trying to load model from My Models...')
      const modelsRes = await fetch('/api/my-models', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-cache'
      })
      
      console.log('🔍 My Models API response status:', modelsRes.status)
      
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json()
        console.log('📋 My Models data:', modelsData)
        if (modelsData.success && modelsData.models?.length > 0) {
          const firstModel = modelsData.models[0]
          setUserModelImage(firstModel.image_url)
          console.log('📸 ✅ Auto-loaded model from My Models:', firstModel.image_url)
        } else {
          console.log('❌ No models found in My Models')
          // Try wardrobe as last fallback
          await loadModelFromWardrobe(accessToken)
        }
      } else {
        console.log('❌ Failed to load My Models, status:', modelsRes.status)
        const errorText = await modelsRes.text()
        console.log('❌ Error response:', errorText)
        await loadModelFromWardrobe(accessToken)
      }
    } catch (error) {
      console.error('Failed to load from My Models:', error)
      await loadModelFromWardrobe(accessToken)
    }
  }
  
  // Helper function to load model from Wardrobe
  const loadModelFromWardrobe = async (accessToken: string) => {
    try {
      console.log('🔄 Trying to load model from Wardrobe...')
      const wardrobeRes = await fetch('/api/wardrobe?page=1&pageSize=5', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        cache: 'no-cache'
      })
      
      console.log('🔍 Wardrobe API response status:', wardrobeRes.status)
      
      if (wardrobeRes.ok) {
        const wardrobeData = await wardrobeRes.json()
        console.log('👔 Wardrobe data:', wardrobeData)
        if (wardrobeData.items?.length > 0) {
          const firstItem = wardrobeData.items[0]
          setUserModelImage(firstItem.image_url)
          console.log('📸 ✅ Auto-loaded model from Wardrobe:', firstItem.image_url)
        } else {
          console.log('❌ No items found in Wardrobe')
        }
      } else {
        console.log('❌ Failed to load Wardrobe, status:', wardrobeRes.status)
        const errorText = await wardrobeRes.text()
        console.log('❌ Error response:', errorText)
      }
    } catch (error) {
      console.error('Failed to load from Wardrobe:', error)
    }
  }

  // Force reload data function
  const forceReloadData = async () => {
    console.log('🔄 Force reloading all data...')
    setUserModelImage(null)
    setProfileLoaded(false)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        // Reload profile
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          cache: 'no-cache'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.profile?.try_on_photo_url) {
            setUserModelImage(data.profile.try_on_photo_url)
            console.log('📸 ✅ Force reloaded model from profile:', data.profile.try_on_photo_url)
            return
          }
        }
        
        // Fallback to My Models
        await loadModelFromMyModels(session.access_token)
      }
    } catch (error) {
      console.error('Force reload failed:', error)
    } finally {
      setProfileLoaded(true)
    }
  }

  // Ensure timestamp is always a valid Date when rendering
  const ensureDate = (ts: any): Date => {
    try {
      if (ts instanceof Date) return ts
      const d = new Date(ts)
      return isNaN(d.getTime()) ? new Date() : d
    } catch {
      return new Date()
    }
  }

  // Extract bracketed quick options from AI text: e.g. "[đi chơi | đi làm | hẹn hò]"
  const buildQuickActionsFromAnswer = (text?: string): ChatAction[] | undefined => {
    try {
      const t = (text || '').trim()
      if (!t) return undefined
      const match = t.match(/\[(.+?)\]/)
      if (!match) return undefined
      const parts = match[1].split('|').map(s => s.trim()).filter(Boolean)
      if (parts.length < 2) return undefined
      return filterActions(parts.map((label) =>
        createAction({ label, kind: 'quick-text', value: label, submitType: 'chat' })
      ))
    } catch {
      return undefined
    }
  }

  const pushBotMessage = async (content: string, extra?: Partial<Message>) => {
    // small natural delay before responding
    await sleep(250)
    let safeContent = content ?? ''
    if (typeof safeContent !== 'string') safeContent = String(safeContent ?? '')
    if (safeContent.trim().length === 0) {
      safeContent = ''
    }
    
    // Apply personalization only (emotional layer removed)
    let personalizedContent = conversationContext ? getPersonalizedResponse(safeContent) : safeContent
    
    // Build fallback quick actions if none provided
    let computedActions: ChatAction[] | undefined = undefined
    if (ENABLE_ACTIONS && !extra?.actions) {
      try {
        const actions = generateQuickActions(followUpContext)
          .slice(0, 3)
          .map(a => createAction({ label: a.label, value: a.value, kind: 'quick-text', submitType: 'chat' }))
        computedActions = filterActions(actions)
      } catch {}
    }
    
    const message: Message = {
      id: generateMessageId(),
      type: 'bot',
      content: personalizedContent
        .replace(/\r\n|\r/g, '\n')
        .replace(/\n{2,}/g, '\n\n'),
      timestamp: new Date(),
      ...extra,
      ...(ENABLE_ACTIONS
        ? { actions: filterActions(extra?.actions) ?? computedActions }
        : {}),
    }
    setMessages((prev) => [...prev, message])
    return message
  }

  // Phase 4: Advanced Feature Handlers
  const handleAdvancedFeature = (feature: 'quiz' | 'analytics') => {
    setActiveFeature(feature)
    setShowAdvancedFeatures(true)
  }



  const handleStyleQuizComplete = (result: any) => {
    console.log('Style quiz completed:', result)
    
    // Create a comprehensive quiz result message
    const quizSummary = `
🎯 **Kết quả trắc nghiệm phong cách:**

**Phong cách của bạn:** ${result.stylePersonality}
**Độ tin cậy:** ${Math.round(result.confidence * 100)}%

**Đặc điểm phong cách:**
${result.styleTraits.map((trait: any) => `• ${trait.trait}: ${trait.description}`).join('\n')}

**Màu sắc phù hợp:** ${result.colorPalette.primary.join(', ')}

**Thương hiệu gợi ý:** ${result.brandSuggestions.map((brand: any) => brand.brand).join(', ')}

Tôi đã tìm thấy một số sản phẩm phù hợp với phong cách của bạn! Bạn có muốn xem chi tiết không? 😊
    `.trim()

    const botMessage: Message = {
      id: generateMessageId(),
      type: 'bot',
      content: quizSummary,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMessage])
    
    // Close the advanced features modal
    setShowAdvancedFeatures(false)
    setActiveFeature(null)
    
    // Add follow-up suggestions
    setTimeout(() => {
      const followUpMessage: Message = {
        id: generateMessageId(),
        type: 'bot',
        content: 'Bạn có muốn tôi tìm thêm sản phẩm phù hợp với phong cách này không? Hoặc bạn có câu hỏi gì về phong cách thời trang?',
        timestamp: new Date(),
        actions: [
          createAction({ label: 'Tìm sản phẩm phù hợp', kind: 'service', value: 'search-products' }),
          createAction({ label: 'Tư vấn phong cách', kind: 'service', value: 'style-advice' }),
          createAction({ label: 'Làm lại trắc nghiệm', kind: 'service', value: 'retake-quiz' })
        ]
      }
      setMessages(prev => [...prev, followUpMessage])
    }, 1000)
  }


  const handleActionClick = (action: ChatAction) => {
    if (!action) return

    if (action.kind === 'link') {
      const target = action.href || action.value
      if (target) window.open(target, '_blank', 'noopener,noreferrer')
      return
    }

    if (action.kind === 'quick-text') {
      setInputValue(action.value)
      requestAnimationFrame(() => inputRef.current?.focus())

      if (action.autoSend) {
        if (isLoading || isSubmittingRef.current) {
          toast.error('Cho minh hoan thanh yeu cau hien tai nha!')
          return
        }
        setTimeout(() => {
          if (action.submitType === 'search') {
            handleQuickSearch(action.value, undefined, { userMessageContent: action.value })
          } else {
            const fakeEvent = {
              preventDefault: () => {},
              stopPropagation: () => {},
            } as any
            handleSubmit(fakeEvent)
          }
        }, 50)
      }
      return
    }

    if (action.kind === 'service') {
      switch (action.value) {
        case 'open-try-on': {
          pushBotMessage('Chon anh full-body ro net de thu do ao nhe! Neu can, minh se huong dan them.')
          toast('Chon anh full-body ro net de thu do ao nhe!')
          fileInputRef.current?.click()
          return
        }
        case 'book-stylist': {
          toast('Minh se tao yeu cau dat lich cho ban, chon khung gio ben duoi nhe!')
          pushBotMessage('Dat lich stylist Clothify mien phi: chon khung gio phu hop nhe.', {
            actions: [
              createAction({ label: 'Hen sang mai', kind: 'quick-text', value: 'Cho minh dat lich stylist Clothify sang mai luc 9h', submitType: 'chat', autoSend: true }),
              createAction({ label: 'Hen toi nay', kind: 'quick-text', value: 'Mong duoc dat lich stylist Clothify toi nay sau 19h', submitType: 'chat', autoSend: true }),
              createAction({ label: 'Hen cuoi tuan', kind: 'quick-text', value: 'Giup minh dat lich stylist Clothify vao cuoi tuan nay', submitType: 'chat', autoSend: true }),
            ],
          })
          return
        }
        case 'open-wardrobe': {
          pushBotMessage('Dang mo trang Tu do so cho ban. Neu chua thay chuyen, bam vao menu Tu do nhe!')
          toast.success('Da mo trang Tu do so cho ban!')
          router.push('/wardrobe')
          return
        }
        case 'reload-data': {
          pushBotMessage('🔄 Đang tải lại dữ liệu từ cơ sở dữ liệu...')
          toast('Đang tải lại dữ liệu...', { icon: '🔄' })
          forceReloadData().then(() => {
            if (userModelImage) {
              pushBotMessage('✅ Đã tải lại dữ liệu thành công! Tìm thấy ảnh model của bạn.')
              toast.success('Tải lại dữ liệu thành công!')
            } else {
              pushBotMessage('⚠️ Đã tải lại dữ liệu nhưng vẫn chưa tìm thấy ảnh model. Vui lòng tải ảnh model mới.')
              toast.error('Chưa tìm thấy ảnh model')
            }
          }).catch(() => {
            pushBotMessage('❌ Có lỗi khi tải lại dữ liệu. Vui lòng thử lại sau.')
            toast.error('Lỗi tải dữ liệu')
          })
          return
        }
        default: {
          pushBotMessage('Dich vu nay dang duoc cap nhat, ban noi ro hon de minh tro giup nhe!')
          return
        }
      }
    }
  }

  // Load user profile and model image - ALWAYS reload on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          console.log('❌ No session found')
          return
        }
        
        console.log('🔄 Loading user profile...')
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          cache: 'no-cache' // Force fresh data
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('👤 Profile data loaded:', data)
          if (data.profile?.try_on_photo_url) {
            setUserModelImage(data.profile.try_on_photo_url)
            console.log('📸 ✅ Loaded user model image from profile:', data.profile.try_on_photo_url)
          } else {
            console.log('❌ No try_on_photo_url found in profile:', data.profile)
            // Try to load from My Models as fallback
            await loadModelFromMyModels(session.access_token)
          }
        } else {
          console.log('❌ Failed to load profile:', response.status, response.statusText)
          // Try to load from My Models as fallback
          await loadModelFromMyModels(session.access_token)
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        // Try to load from My Models as fallback
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            await loadModelFromMyModels(session.access_token)
          }
        } catch {}
      } finally {
        setProfileLoaded(true)
      }
    }
    
    
    loadUserProfile()
  }, []) // Removed profileLoaded dependency to always reload

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }) // Changed to auto for speed
  }

  const handleWardrobeAnalysis = async (imageUrl: string, userDescription?: string) => {
    if (!session?.user) {
      toast.error('Vui lòng đăng nhập để thêm vào tủ đồ')
      return
    }

    try {
      setWardrobeAnalysisLoading(true)
      
      const response = await fetch('/api/wardrobe/analyze-and-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          imageUrl,
          userDescription,
          userId: session?.user?.id || ''
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Wardrobe analysis failed')
      }

      if (data.success && data.item) {
        pushBotMessage(`✅ **Đã thêm vào tủ đồ thành công!**\n\n**${data.item.title}**\n- Loại: ${data.item.category}\n- Màu: ${data.item.color}\n- Phong cách: ${data.item.style_tags?.join(', ') || 'Chưa xác định'}\n- Dịp sử dụng: ${data.item.occasion_tags?.join(', ') || 'Chưa xác định'}\n\n*Tôi sẽ sử dụng thông tin này để tư vấn phù hợp hơn cho bạn!*`)
        toast.success('Đã thêm vào tủ đồ thành công!')
      } else {
        throw new Error('No item data returned')
      }
      
    } catch (error) {
      console.error('Wardrobe analysis error:', error)
      pushBotMessage('Xin lỗi, có lỗi xảy ra khi thêm vào tủ đồ. Bạn thử lại sau nhé!')
      toast.error('Có lỗi xảy ra khi thêm vào tủ đồ')
    } finally {
      setWardrobeAnalysisLoading(false)
    }
  }

  // Handle try-on button click - check tokens and show confirmation
  const handleTryOnApi = async (productImageUrl: string) => {
    try {
      if (!productImageUrl) {
        toast.error('Không có ảnh sản phẩm để thử đồ')
        return
      }
      
      if (!userModelImage) {
        pushBotMessage('Bạn cần tải ảnh người mẫu của bạn trước (full/half body). Hãy gửi ảnh tại đây hoặc vào mục Tủ đồ để lưu ảnh mẫu nhé!', {
          actions: [
            createAction({ label: '🔄 Tải lại dữ liệu', kind: 'service', value: 'reload-data' }),
            createAction({ label: '📷 Tải ảnh model', kind: 'service', value: 'open-try-on' }),
            createAction({ label: '👔 Mở tủ đồ', kind: 'service', value: 'open-wardrobe' }),
          ]
        })
        return
      }

      // Check user tokens first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Vui lòng đăng nhập để sử dụng tính năng này')
        return
      }

      // Fetch current token balance
      const tokenRes = await fetch('/api/membership/tokens', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (!tokenRes.ok) {
        toast.error('Không thể kiểm tra số token. Vui lòng thử lại.')
        return
      }
      
      const tokenData = await tokenRes.json()
      const availableTokens = tokenData.tokens?.total_tokens || 0

      // Check if user has enough tokens
      if (availableTokens < 1) {
        pushBotMessage('⚠️ Bạn không đủ token để thử đồ ảo. Vui lòng mua thêm token để tiếp tục sử dụng tính năng này.', {
          actions: [
            createAction({ label: '💎 Mua token', kind: 'service', value: 'buy-tokens' }),
            createAction({ label: '📊 Xem gói thành viên', kind: 'service', value: 'view-membership' }),
          ]
        })
        return
      }

      // Show confirmation modal instead of chat message
      setShowTryOnConfirmModal({
        productImageUrl,
        availableTokens
      })
      
    } catch (e: any) {
      console.error('tryon check error', e)
      toast.error('Có lỗi xảy ra khi kiểm tra token')
    }
  }

  // Execute the actual try-on after confirmation and token deduction
  const executeRealTryOn = async (productImageUrl: string) => {
    try {
      // Set loading state immediately
      setTryOnLoading(productImageUrl)
      
      // Get session token once
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Chưa đăng nhập')
      }
      
      // Use existing try-on API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
      
      const res = await fetch('/api/clothify/try-on', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          personImage: userModelImage,
          clothingImage: productImageUrl,
          clothingImageUrls: [productImageUrl],
          selectedGarmentType: 'auto',
          fastMode: true
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
      
      const data = await res.json()
      if (!res.ok || !data?.success || !data?.resultImageUrl) {
        throw new Error(data?.error || 'Try-on thất bại')
      }
      
      // Store the result
      setTryOnResults(prev => new Map(prev).set(productImageUrl, data.resultImageUrl))
      
      pushBotMessage('Ảnh thử đồ đã sẵn sàng:')
      pushBotMessage('', { 
        image: data.resultImageUrl,
        onClick: () => setShowImageModal({ url: data.resultImageUrl, alt: 'Ảnh thử đồ' })
      } as any)
      
    } catch (e: any) {
      console.error('tryon error', e)
      if (e.name === 'AbortError') {
        pushBotMessage('Thử đồ mất quá nhiều thời gian. Vui lòng thử lại sau.')
      } else {
        pushBotMessage('Xin lỗi, hiện chưa thử đồ được. Bạn thử lại sau nhé!')
      }
    } finally {
      setTryOnLoading(null)
    }
  }

  // Global functions for HTML onclick handlers
  const handleTryOnClick = (button: HTMLElement) => {
    const card = button.closest('.border')
    if (card) {
      const productName = card.querySelector('strong')?.textContent || ''
      const productLink = card.querySelector('a')?.href || ''
      
      // Extract product ID from URL for image
      const urlMatch = productLink.match(/products\/([^\/\?]+)/)
      const productId = urlMatch ? urlMatch[1] : ''
      
      // For now, use a placeholder image URL - you can enhance this later
      const productImageUrl = `https://torano.vn/products/${productId}`
      
      handleTryOnApi(productImageUrl)
    }
  }

  const handleBuyClick = (button: HTMLElement) => {
    const card = button.closest('.border')
    if (card) {
      const productLink = card.querySelector('a')?.href || ''
      if (productLink) {
        window.open(productLink, '_blank')
      }
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Hãy chọn đúng định dạng ảnh.')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    event.target.value = '' // Clear the file input after selection
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      try {
        const dataTransfer = new DataTransfer()
        fileInputRef.current.files = dataTransfer.files
      } catch (e) {
        console.error('Could not reset file input using DataTransfer:', e)
      }
    }
  }

  // No localStorage saving - messages stay in memory for speed

  // Update conversation context when messages change (optimized)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === 'user' && conversationContext) {
        updateContext(lastMessage, messages)
        saveContext()
      }
    }
    // Scroll to bottom only for new messages
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages, updateContext, saveContext, conversationContext])

  // Persist conversation to server (debounced) - OPTIMIZED
  useEffect(() => {
    const save = async () => {
      if (!session?.access_token) return
      try {
        await fetch('/api/chat/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages }),
        })
      } catch (e) {
        console.error('Lưu hội thoại thất bại:', e)
      }
    }
    const deb = debounce(save, 2000) // Increased to 2s to reduce API calls
    deb()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, session?.access_token])

  // Keep focus on input by default
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Register global functions for HTML onclick handlers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).handleTryOnClick = handleTryOnClick
      ;(window as any).handleBuyClick = handleBuyClick
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).handleTryOnClick
        delete (window as any).handleBuyClick
      }
    }
  }, [])

  // Load server-side conversation if logged in (fallback over localStorage)
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (!currentSession?.access_token) return
        // Prefetch profile once per session and cache locally
        // No localStorage caching for speed
      } catch (e) {
        console.error('Load conversation failed:', e)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token])

  // Function to clear conversation
  const clearConversation = () => {
    const initialMessage = buildWelcomeMessage()
    setMessages([initialMessage])
    clearContext() // Clear conversation context
    toast.success('Đã xóa cuộc trò chuyện!', {
      duration: 2000,
      icon: '🗑️',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    })
  }

  // Request personalized recommendations using AI systems
  const requestRecommendations = async () => {
    // SIMPLE MODE: Use stylist/chat endpoint for on-demand suggestions
    if (SIMPLE_MODE) {
      setIsLoading(true)
      try {
        const recentContext = messages
          .slice(-12)
          .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: String(m.content || '') }))
        const convSummary = (() => {
          try {
            const cached = null // No localStorage for speed
            if (cached) return `PROFILE: ${cached}`
          } catch {}
          return conversationContext ? getContextForAI() : ''
        })()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // Increased to 60s for stability
        const resp = await fetch('/api/stylist/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Cho mình gợi ý sản phẩm phù hợp.', context: recentContext, summary: convSummary }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        const data = await parseResponseJson(resp)
        if (!resp.ok) throw new Error(data.error || 'Gợi ý thất bại')

        if (data.answer) {
          const single = normalizeSingleProductAnswer(String(data.answer))
          const actions = buildQuickActionsFromAnswer(single)
          await sleep(300)
          await pushBotMessage(single, actions ? { actions } : undefined)
        }
      } catch (e: any) {
        console.error('Simple recommend error:', e)
        pushBotMessage('Xin lỗi, hiện chưa gợi ý được. Bạn thử lại sau nhé!')
      } finally {
        setIsLoading(false)
      }
      return
    }
    if (!session?.access_token) return
    setIsLoading(true)
    try {
      // Build user profile
      let userProfile = null
      if (session?.user?.id && conversationContext) {
        userProfile = await personalizationEngine.buildUserProfile(
          session.user.id,
          conversationContext
        )
      }

      // Get products from API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // Increase to 60 seconds

      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          userProfile,
          conversationContext,
          limit: 20
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Gợi ý thất bại')

      const rawProducts = data.items || []
      const products: ProductData[] = rawProducts.map((item: any) => mapProductToCard(item))

      // Apply personalization engine
      const personalizedResults = (userProfile && conversationContext) ? await personalizationEngine.generatePersonalizedRecommendations(
        products,
        userProfile,
        conversationContext,
        6
      ) : []

      const recommendedProducts = personalizedResults.map((result: any) => result.product)

      if (recommendedProducts.length > 0) {
        pushBotMessage('Mình đã chọn lọc những sản phẩm phù hợp nhất với sở thích và phong cách của bạn:')

        // Products will be shown in text format by AI

        pushBotMessage('Bạn có muốn mình hỗ trợ thêm gì nữa không?', {
          actions: [
            createAction({
              label: 'Cập nhật sở thích',
              kind: 'quick-text',
              value: 'Nhắc mình cập nhật sở thích và phong cách hiện tại nhé',
              submitType: 'chat',
            }),
            createAction({ label: 'Tìm sản phẩm khác', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm khác' }),
            createAction({ label: 'Đặt lịch stylist', kind: 'service', value: 'book-stylist' }),
            createAction({ label: 'Thử đồ ảo', kind: 'service', value: 'open-try-on' }),
          ],
        })
      } else {
        pushBotMessage('Mình chưa có đủ thông tin để đưa ra gợi ý phù hợp. Hãy để mình hỏi bạn một vài câu để hiểu rõ hơn về sở thích của bạn nhé!', {
          actions: [
            createAction({
              label: 'Khảo sát sở thích',
              kind: 'quick-text',
              value: 'Mình muốn làm khảo sát về sở thích thời trang',
              submitType: 'chat',
            }),
            createAction({ label: 'Tìm sản phẩm', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm cụ thể' }),
            createAction({ label: 'Đặt lịch stylist', kind: 'service', value: 'book-stylist' }),
          ],
        })
      }
    } catch (e: any) {
      console.error('Enhanced recommend error:', e)
      toast.error('Không thể lấy gợi ý')
      pushBotMessage('Xin lỗi, mình gặp khó khăn trong việc tạo gợi ý. Bạn có thể thử tìm kiếm sản phẩm cụ thể hoặc đặt lịch stylist để được hỗ trợ tốt hơn nhé!')
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced product search with AI-powered systems
  const handleQuickSearch = async (
    query: string,
    entities?: any,
    options?: { skipUserMessage?: boolean; userMessageContent?: string; fallbackQuery?: string }
  ) => {
    // SIMPLE MODE: Delegate to stylist/chat API for a robust default experience
    if (SIMPLE_MODE) {
      const trimmedQuery = (query ?? '').trim()
      const messageText = (options?.userMessageContent ?? trimmedQuery ?? '').trim()
      if (!messageText) return

      if (!options?.skipUserMessage) {
        const userMessage: Message = {
          id: generateMessageId(),
          type: 'user',
          content: messageText,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMessage])
      }

      setIsLoading(true)
      try {
        const recentContext = messages
          .slice(-6)
          .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: String(m.content || '') }))
        const convSummary = (() => {
          try { const c = null; if (c) return `PROFILE: ${c}` } catch {} // No localStorage for speed
          return conversationContext ? getContextForAI() : ''
        })()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // Increased to 60s for stability
        const resp = await fetch('/api/stylist/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `${messageText}\n\nYêu cầu hệ thống: Chỉ gợi ý đúng 1 sản phẩm nổi bật nhất. Hoàn tất câu trả lời, không để dở dang.`, context: recentContext, summary: convSummary }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        const data = await parseResponseJson(resp)
        if (!resp.ok) throw new Error(data.error || 'Search failed')

        if (data.answer) {
          const single = normalizeSingleProductAnswer(String(data.answer))
          const actions = buildQuickActionsFromAnswer(single)
          await sleep(300)
          await pushBotMessage(single, actions ? { actions } : undefined)
          
          // Display products if available
          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            const firstItem = data.products[0]
            const product = mapProductToCard(firstItem)
            await pushBotMessage('', { product })
          }
        }
      } catch (err: any) {
        console.error('Simple search error:', err)
        pushBotMessage(`Lỗi tìm kiếm: ${err?.message || String(err)}`)
      } finally {
        setIsLoading(false)
        isSubmittingRef.current = false
        requestAnimationFrame(() => inputRef.current?.focus())
      }
      return
    }
    const trimmedQuery = (query ?? '').trim()
    const fallbackQuery = (options?.fallbackQuery ?? '').trim()
    const activeEntities = entities ?? {}
    const hasEntities = Object.keys(activeEntities).length > 0
    if (!trimmedQuery && !hasEntities && !fallbackQuery) return
    if (isLoading || isSubmittingRef.current) return

    if (searchTimeout) window.clearTimeout(searchTimeout)

    const executeSearch = async () => {
      isSubmittingRef.current = true
      const messageText = (options?.userMessageContent ?? trimmedQuery ?? '').trim()

      if (!options?.skipUserMessage && messageText) {
        const userMessage: Message = {
          id: generateMessageId(),
          type: 'user',
          content: messageText,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMessage])
      }

      setIsLoading(true)
      try {
        // Build user profile if available
        let userProfile = null
        if (session?.user?.id && conversationContext) {
          userProfile = await personalizationEngine.buildUserProfile(
            session.user.id,
            conversationContext
          )
        }

        // Create advanced filters using new system
        const advancedFilters = createAdvancedFilters(
          trimmedQuery || fallbackQuery || messageText,
          conversationContext,
          userProfile
        )

        // Get products from API with smart query enhancement
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // Increased to 60s for stability

        // Enhance query for better results
        let enhancedQuery = trimmedQuery || messageText
        if (enhancedQuery.includes('đi học') || enhancedQuery.includes('đi trường')) {
          enhancedQuery = enhancedQuery + ' casual thoải mái áo thun áo sơ mi'
        }

        const res = await fetch('/api/stylist/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            q: enhancedQuery, 
            limit: 20,
            filters: advancedFilters
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        const data = await parseResponseJson(res)
        if (!res.ok) {
          throw new Error(data.error || 'Khong the tim kiem')
        }

        const rawResults: any[] = Array.isArray(data.result) ? data.result : []

        if (rawResults.length === 0) {
          const summaryLabel = trimmedQuery || messageText || 'tieu chi vua chon'
          pushBotMessage(`Chua thay san pham nao khop voi "${summaryLabel}". De minh dieu chinh tim kiem hoac dat lich thu do ao cho ban nhe?`)

          const baseQuery = (trimmedQuery || messageText || fallbackQuery || '').trim()
          if (!activeEntities.price) {
            promptClarify('price', baseQuery, activeEntities)
            return
          }
          if (!activeEntities.color) {
            promptClarify('color', baseQuery, activeEntities)
            return
          }
          if (!activeEntities.size) {
            promptClarify('size', baseQuery, activeEntities)
            return
          }
          if (!activeEntities.occasion) {
            promptClarify('occasion', baseQuery, activeEntities)
            return
          }

          pushBotMessage(
            'Thu bo sung them tu khoa cu the hon (vi du: "ao thun trang di lam duoi 400k") hoac chon mot dich vu ben duoi nhe.',
            {
              actions: [
                createAction({
                  label: 'Them lua chon khac',
                  kind: 'quick-text',
                  value: `Cho minh them lua chon khac cho "${summaryLabel}" nhe`,
                  submitType: 'chat',
                  autoSend: true,
                }),
                createAction({ label: 'Dat lich stylist', kind: 'service', value: 'book-stylist' }),
                createAction({ label: 'Thu do ao bang anh', kind: 'service', value: 'open-try-on' }),
              ],
            }
          )
          return
        }

        // Convert to ProductData
        const products: ProductData[] = rawResults.map((item: any) => mapProductToCard(item))

        // Apply advanced filtering and ranking
        const filteredResults = await advancedFilteringEngine.applyAdvancedFilters(
          products,
          advancedFilters,
          userProfile,
          conversationContext
        )

        // Apply semantic search for better relevance
        const semanticResults = await semanticSearchEngine.semanticSearch(
          trimmedQuery || messageText,
          products,
          advancedFilters,
          10
        )

        // Combine and rank results
        const combinedResults = [...filteredResults, ...semanticResults]
        const uniqueResults = combinedResults.reduce((acc, result) => {
          const existing = acc.find((r: any) => r.product.id === result.product.id)
          if (!existing) {
            acc.push(result)
          } else if (result.relevanceScore > existing.relevanceScore) {
            const index = acc.indexOf(existing)
            acc[index] = result
          }
          return acc
        }, [] as any[])

        // Sort by relevance score
        uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

        // Take top results
        const topResults = uniqueResults.slice(0, 6)
        const finalProducts = topResults.map(result => result.product)

        // Update search history
        if (conversationContext) {
          addSearchHistory(
            trimmedQuery || messageText,
            finalProducts,
            [] // clicked products will be updated when user clicks
          )
        }

        // Generate AI-powered summary
        const contextForAI = conversationContext ? getContextForAI() : ''
        const aiSummaryController = new AbortController()
        const aiTimeoutId = setTimeout(() => aiSummaryController.abort(), 15000)

        const aiSummaryResponse = await fetch('/api/stylist/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `Tôi đã tìm được ${finalProducts.length} sản phẩm phù hợp cho yêu cầu "${trimmedQuery || messageText}". ${contextForAI} Hãy tạo một thông báo ngắn gọn và tự nhiên để giới thiệu CHỈ 1 sản phẩm tiêu biểu nhất cho khách hàng, trả lời trọn vẹn, không để dở dang.`
          }),
          signal: aiSummaryController.signal,
        }).finally(() => clearTimeout(aiTimeoutId))
        
        const aiSummaryData = await parseResponseJson(aiSummaryResponse)
        const summaryText = aiSummaryData.answer ? normalizeSingleProductAnswer(String(aiSummaryData.answer)) : `Mình đã sàng lọc ${finalProducts.length} lựa chọn phù hợp cho bạn. Bấm "Thử ngay" để xem sản phẩm gợi ý.`

        // Display only the first result
        if (finalProducts.length > 0) {
          await pushBotMessage(summaryText)
          const first = finalProducts[0]
          if (first) await pushBotMessage('', { product: first })
        }

        setPendingClarify(null)
      } catch (err: any) {
        console.error('Enhanced search error:', err)
        pushBotMessage(`Loi tim kiem: ${err.message || err}`)
      } finally {
        setIsLoading(false)
        isSubmittingRef.current = false
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    }

    searchTimeout = window.setTimeout(executeSearch, 300)
  }

  const CLARIFY_ENABLED = false

  const promptClarify = (
    type: 'price' | 'color' | 'size' | 'occasion' | 'season' | 'material',
    originalQuery?: string,
    entities?: any
  ) => {
    if (!CLARIFY_ENABLED) return
    setPendingClarify({ type, originalQuery, entities })
    const content =
      type === 'price'
        ? 'Bạn muốn tầm giá bao nhiêu?'
        : type === 'color'
        ? 'Bạn thích màu nào?'
        : type === 'size'
        ? 'Bạn mặc size nào?'
        : 'Bạn dùng dịp nào?'
    const botMessage: Message = {
      id: generateMessageId(),
      type: 'bot',
      content,
      timestamp: new Date(),
      actions: [
        createAction({ label: 'Bỏ qua', kind: 'quick-text', value: 'Tìm sản phẩm bình thường', submitType: 'search', autoSend: true }),
        createAction({ label: 'Hủy', kind: 'quick-text', value: 'Hủy tìm kiếm' }),
      ]
    }
    setMessages((prev) => [...prev, botMessage])
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleClarifyResponse = (value: string) => {
    if (!CLARIFY_ENABLED) return
    if (!pendingClarify) return
    
    // Handle cancel/skip actions
    if (value.toLowerCase().includes('hủy') || value.toLowerCase().includes('cancel')) {
      setPendingClarify(null)
      pushBotMessage('Đã hủy tìm kiếm. Bạn muốn làm gì khác?', {
        actions: [
          createAction({ label: '🔍 Tìm sản phẩm', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm phù hợp', submitType: 'search' }),
          createAction({ label: '🎨 Tư vấn phong cách', kind: 'quick-text', value: 'Tư vấn phong cách cho mình với.' }),
          createAction({ label: '📸 Phân tích ảnh', kind: 'service', value: 'open-try-on' }),
        ]
      })
      return
    }
    
    if (value.toLowerCase().includes('bỏ qua') || value.toLowerCase().includes('bình thường')) {
      setPendingClarify(null)
      const baseQuery = (pendingClarify.originalQuery ?? '').trim()
      if (baseQuery) {
        handleQuickSearch(baseQuery, {}, {
          userMessageContent: baseQuery,
          fallbackQuery: baseQuery,
        })
      } else {
        pushBotMessage('Bạn muốn tìm sản phẩm gì?', {
          actions: [
            createAction({ label: 'Áo sơ mi', kind: 'quick-text', value: 'Tìm áo sơ mi', submitType: 'search', autoSend: true }),
            createAction({ label: 'Quần jeans', kind: 'quick-text', value: 'Tìm quần jeans', submitType: 'search', autoSend: true }),
            createAction({ label: 'Áo khoác', kind: 'quick-text', value: 'Tìm áo khoác', submitType: 'search', autoSend: true }),
          ]
        })
      }
      return
    }
    
    const { type, originalQuery, entities } = pendingClarify
    const merged = { ...(entities || {}) }
    
    if (type === 'price') {
      const v = value.toLowerCase()
      if (/^dưới\s*300k$/.test(v) || /<\s*300/.test(v)) merged.price = 300000
      else if (/300\s*-\s*600k/.test(v) || /300-600k/.test(v)) merged.price = 600000
      else if (/trên\s*600k/.test(v) || />\s*600/.test(v)) merged.price = 1200000
      else if (value.includes('300')) merged.price = 300000
      else if (value.includes('500')) merged.price = 500000
      else merged.price = parseInt(value.replace(/[^0-9]/g, '')) || 500000
    } else if (type === 'color') {
      merged.color = value
    } else if (type === 'size') {
      merged.size = value
    } else if (type === 'occasion') {
      merged.occasion = value
    } else if (type === 'season') {
      merged.season = value
    } else if (type === 'material') {
      const list = Array.isArray(merged.material) ? merged.material : []
      if (!list.includes(value)) list.push(value)
      merged.material = list
    }

    setPendingClarify(null)
    const baseQuery = (originalQuery ?? '').trim()
    const searchQuery = baseQuery || value
    handleQuickSearch(searchQuery, merged, {
      userMessageContent: value,
      fallbackQuery: baseQuery,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling

    // Phase 4: Advanced NLU Processing
    if (inputValue.trim()) {
      try {
        const nluResult = await analyzeText(inputValue)
        console.log('Advanced NLU Result:', nluResult)
        
        // Update conversation state based on intent
        const intent = nluResult.intent as UserIntent
        transition(intent, nluResult.entities)
        
        // Update follow-up context
        setFollowUpContext(prev => ({
          ...prev,
          currentTopic: nluResult.context.topic,
          urgency: nluResult.context.urgency,
          conversationFlow: [...prev.conversationFlow, inputValue]
        }))
        
        // Process response for follow-up system
        if (nluResult.followUpQuestions.length > 0) {
          // Store follow-up questions for later use
          console.log('Follow-up questions:', nluResult.followUpQuestions)
        }
        
      } catch (error) {
        console.error('Advanced NLU processing failed:', error)
      }
    }

    if ((!inputValue.trim() && !selectedImage) || isLoading) return

    if (isLoading || isSubmittingRef.current) return

    isSubmittingRef.current = true

    let messageImage: string | undefined
    if (selectedImage) {
      if (imagePreview) {
        messageImage = imagePreview
      } else {
        messageImage = await new Promise<string | undefined>((resolve) => {
          const reader = new FileReader()
          reader.onload = (event) => resolve(event.target?.result as string)
          reader.onerror = () => resolve(undefined)
          reader.readAsDataURL(selectedImage)
        })
      }
    }

    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: inputValue || 'Tôi vừa gửi ảnh để phân tích',
      timestamp: new Date(),
      image: messageImage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // --- QUICK COMMAND: update size ---
      const sizeMatch = inputValue.toLowerCase().match(/size\s*(xs|s|m|l|xl)\b/)
      if (sizeMatch && session?.access_token) {
        try {
          const newSize = sizeMatch[1].toUpperCase()
          await updateUserSize(newSize, session.access_token)
          pushBotMessage(`✅ Đã cập nhật size của bạn thành ${newSize}.`)
        } catch (err: any) {
          pushBotMessage(`❌ Không cập nhật được size: ${err.message}`)
        }
        setIsLoading(false)
        isSubmittingRef.current = false
        return
      }

      // Prioritize uploaded image analysis
      if (selectedImage) {
        // Upload to Supabase storage first
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${session?.user?.id}-${Date.now()}.${fileExt}`
        const filePath = `uploads/${fileName}`

        // Try multiple buckets for upload
        const bucketNames = ['user-uploads', 'uploads', 'images', 'wardrobe']
        let uploadResponse = null
        let bucketName = 'user-uploads'
        
        for (const bucket of bucketNames) {
          try {
            uploadResponse = await supabase.storage
              .from(bucket)
              .upload(filePath, selectedImage)
            
            if (!uploadResponse.error) {
              bucketName = bucket
              break
            }
          } catch (e) {
            console.log(`Failed to upload to ${bucket}:`, e)
            continue
          }
        }

        if (!uploadResponse || uploadResponse.error) {
          throw new Error(`Upload failed: ${uploadResponse?.error?.message || 'No bucket available'}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        // Add user message with image
        pushBotMessage('', { image: publicUrl })
        
        // Check if user wants wardrobe analysis or general analysis
        const message = inputValue || ''
        const wantsWardrobe = /(tủ đồ|wardrobe|thêm vào|lưu vào|save|add)/i.test(message)
        
        // Always cache the image as user model for try-on
        setUserModelImage(publicUrl)
        console.log('📸 Cached user model image for try-on:', publicUrl)
        
        if (wantsWardrobe) {
          // Add to wardrobe
          await handleWardrobeAnalysis(publicUrl, message)
        } else {
          // General analysis
        const formData = new FormData()
        formData.append('image', selectedImage)
          formData.append('message', message || 'Phân tích trang phục và đưa ra gợi ý')

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000) // Increased to 45s for image analysis

        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        const bodyText = await response.text()
        if (!response.ok) {
          throw new Error(`Lỗi máy chủ: ${response.status} - ${bodyText}`)
        }
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          throw new Error(`Máy chủ trả về sai định dạng: ${bodyText.substring(0, 200)}...`)
        }
        let data
        try {
          data = JSON.parse(bodyText)
        } catch {
          throw new Error('Máy chủ trả về JSON không hợp lệ')
        }

        if (!data.success) {
          throw new Error(data.error || 'Không thể phân tích ảnh')
        }

          pushBotMessage(data.response || data.answer || '')
        toast.success('Phân tích ảnh thành công!')

          // Cache current image as user model image for try-on convenience
          try {
            if (publicUrl) {
              setUserModelImage(publicUrl)
              console.log('📸 Cached user model image:', publicUrl)
            }
          } catch {}
        }

        // Clear image after sending
        removeImage()
        setIsLoading(false)
        isSubmittingRef.current = false
        return
      }

      // SIMPLE MODE: Direct stylist/chat call for text messages
      if (SIMPLE_MODE) {
        try {
          // OPTIMIZED: Reduce context processing for speed
          const recentContext = messages
            .slice(-8)
            .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: String(m.content || '') }))
          const convSummary = (() => {
            try { 
              const c = null // No localStorage for speed
              return c ? `PROFILE: ${c}` : ''
            } catch { return '' }
          })()

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 60000) // Increased to 60s for stability
          const resp = await fetch('/api/stylist/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `${userMessage.content}\n\nYêu cầu hệ thống: Nếu đề xuất sản phẩm, hãy CHỈ gợi ý 1 sản phẩm tốt nhất và trả lời trọn vẹn.`, context: recentContext, summary: convSummary }),
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId))

          // Handle streaming first, then fallback to JSON
          const contentType = resp.headers.get('content-type') || ''
          if (contentType.startsWith('text/')) {
            const reader = resp.body?.getReader()
            let acc = ''
            if (reader) {
              while (true) {
                const { value, done } = await reader.read()
                if (done) break
                acc += new TextDecoder().decode(value)
              }
              // Only push message if we have content
              if (acc.trim()) pushBotMessage(acc)
            }
          } else {
            const data = await parseResponseJson(resp)
            if (!resp.ok) throw new Error(data.error || 'Chat failed')
            if (data.answer) { const single = normalizeSingleProductAnswer(String(data.answer)); await sleep(300); await pushBotMessage(single) }
            
            // Display products if available
            console.log('🔍 Frontend received products:', data.products?.length || 0, 'for message:', inputValue)
            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
              // Always show the first product card
              const firstItem = data.products[0]
              if (firstItem) {
                const product = mapProductToCard(firstItem)
                await pushBotMessage('', { product })
              }
            }
          }
        } catch (err: any) {
          console.error('Simple chat error:', err)
          if (err.name === 'AbortError') {
            pushBotMessage('Xin lỗi, yêu cầu của bạn mất quá nhiều thời gian để xử lý. Vui lòng thử lại với câu hỏi ngắn gọn hơn.')
          } else if (err.message?.includes('Cannot process request')) {
            pushBotMessage('Xin lỗi, hệ thống đang quá tải. Vui lòng thử lại sau ít phút nhé!')
          } else {
            pushBotMessage('Xin lỗi, hiện mình chưa trả lời được. Bạn thử lại nhé!')
          }
        }
        setIsLoading(false)
        isSubmittingRef.current = false
        return
      }

      // Run AI-powered NLU to detect intent for text-only messages
      let nlu: any = null
      if (inputValue.trim()) {
        nlu = await classifyIntentWithAI(inputValue)
        // Use AI to understand and respond naturally
        const contextForAI = conversationContext ? getContextForAI() : ''

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000)

        const aiResponse = await fetch('/api/stylist/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `Người dùng nói: "${inputValue}". ${contextForAI} 
            
            Hướng dẫn:
            - Nếu người dùng muốn tìm sản phẩm, hãy trả lời ngắn gọn và đề xuất tìm kiếm
            - Nếu là câu hỏi chung, hãy trả lời thân thiện và đề xuất các hành động
            - Luôn kết thúc bằng đề xuất các hành động cụ thể
            - Trả lời tự nhiên, không cứng nhắc`
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
        
        const data = await parseResponseJson(aiResponse)
        if (aiResponse.ok && data.answer) {
          const suggestsSearch = data.answer.toLowerCase().includes('tìm') || 
                                data.answer.toLowerCase().includes('search') ||
                                nlu.intent === 'search'
          
          if (suggestsSearch || nlu.intent === 'search') {
            await handleQuickSearch(inputValue, {}, { skipUserMessage: true, userMessageContent: inputValue })
          } else {
            await pushBotMessage(data.answer, {
              actions: [
                createAction({ label: '🔍 Tìm sản phẩm', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm', submitType: 'search' }),
                createAction({ label: '🎨 Tư vấn phong cách', kind: 'quick-text', value: 'Tư vấn phong cách cho mình' }),
                createAction({ label: '📸 Phân tích ảnh', kind: 'service', value: 'open-try-on' }),
                createAction({ label: '👔 Đặt lịch stylist', kind: 'service', value: 'book-stylist' }),
              ],
            })
          }
        } else {
          // Fallback response
          await pushBotMessage('Mình hiểu bạn đang tìm kiếm thông tin về thời trang nam. Hãy để mình giúp bạn:', {
            actions: [
              createAction({ label: '🔍 Tìm sản phẩm', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm', submitType: 'search' }),
              createAction({ label: '🎨 Tư vấn phong cách', kind: 'quick-text', value: 'Tư vấn phong cách cho mình' }),
              createAction({ label: '📸 Phân tích ảnh', kind: 'service', value: 'open-try-on' }),
            ],
          })
        }
        setIsLoading(false)
        isSubmittingRef.current = false
        return
      }
      
      // Handle pending clarification responses
      if (pendingClarify) {
        handleClarifyResponse(inputValue)
        setIsLoading(false)
        isSubmittingRef.current = false
        return
      }
      
      // (Optional) Style advice path if you still want a dedicated branch
      if (nlu && nlu.intent === 'style_advice') {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000)

        const recentContext = messages
          .slice(-12)
          .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))

        const response = await fetch('/api/stylist/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: inputValue, context: recentContext, summary: conversationContext ? getContextForAI() : '' }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))

        const data = await parseResponseJson(response)
        if (!response.ok) {
          throw new Error(data.error || 'Chatbot đang bận, thử lại sau nhé')
        }

        await sleep(300)
        await pushBotMessage(data.answer || 'Mình sẽ kiểm tra thêm thông tin cho bạn nhé!')
        setIsLoading(false)
        isSubmittingRef.current = false
        return
      }

      // Handle any other intents with a helpful response
      const contextForAI2 = conversationContext ? getContextForAI() : ''
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 15000) // Reduced to 15s for speed

      const response2 = await fetch('/api/stylist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `Người dùng nói: "${inputValue}". ${contextForAI2} Hãy trả lời một cách tự nhiên và hữu ích, sau đó đề xuất các hành động tiếp theo.`
        }),
        signal: controller2.signal,
      }).finally(() => clearTimeout(timeoutId2))
      
      const data2 = await parseResponseJson(response2)
      if (response2.ok && data2.answer) {
        await pushBotMessage(data2.answer, {
          actions: [
            createAction({ label: '🔍 Tìm sản phẩm', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm phù hợp', submitType: 'search' }),
            createAction({ label: '🎨 Tư vấn phong cách', kind: 'quick-text', value: 'Tư vấn phong cách cho mình với.' }),
            createAction({ label: '📸 Phân tích ảnh', kind: 'service', value: 'open-try-on' }),
            createAction({ label: '👔 Đặt lịch stylist', kind: 'service', value: 'book-stylist' }),
          ],
        })
      } else {
        await pushBotMessage('Mình hiểu bạn đang tìm kiếm thông tin về thời trang nam. Hãy để mình giúp bạn:', {
          actions: [
            createAction({ label: '🔍 Tìm sản phẩm', kind: 'quick-text', value: 'Mình muốn tìm sản phẩm phù hợp', submitType: 'search' }),
            createAction({ label: '🎨 Tư vấn phong cách', kind: 'quick-text', value: 'Tư vấn phong cách cho mình với.' }),
            createAction({ label: '📸 Phân tích ảnh', kind: 'service', value: 'open-try-on' }),
            createAction({ label: '👔 Đặt lịch stylist', kind: 'service', value: 'book-stylist' }),
          ],
        })
      }
      setIsLoading(false)
      isSubmittingRef.current = false
      return
    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      setIsLoading(false)
      isSubmittingRef.current = false
      if (error.message?.includes('Cannot process request')) {
        pushBotMessage('Xin lỗi, hệ thống đang quá tải. Vui lòng thử lại sau ít phút nhé!')
      } else {
      toast.error('Đã xảy ra lỗi không mong muốn')
      }
    }
  }

  const formatPrice = (price: number | string) => {
    const numeric = typeof price === 'number' ? price : Number(String(price).replace(/[^0-9]/g, ''))
    if (!Number.isFinite(numeric)) {
      return String(price)
    }
    return `${new Intl.NumberFormat('vi-VN').format(numeric)}₫`
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarSolidIcon key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  return (
    <>
    <div className="min-h-screen bg-yellow-300" style={{ backgroundColor: '#FFD93D' }}>
      <div className="w-full h-screen mx-0 my-0 overflow-hidden flex flex-col bg-white border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Sticky Clear Conversation Button */}
      {messages.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)"
          }}
          whileTap={{ scale: 0.95 }}
          onClick={clearConversation}
          className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-red-500 text-white border-4 border-black font-bold uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150"
          title="Xóa hội thoại"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <TrashIcon className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-semibold hidden sm:inline">Xóa hội thoại</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400/20 to-red-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      )}

      {/* Header */}
      <ChatHeader
        onClearConversation={clearConversation}
        onRefreshData={forceReloadData}
        onRequestRecommendations={requestRecommendations}
        isLoading={isLoading}
        messageCount={messages.length}
        isOnline={true}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Debug: Show messages count - removed for performance */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={index >= messages.length - 3 ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {isCompact ? (
                <MobileMessageBubble
                  message={message}
                  onActionClick={handleActionClick}
                  onImageClick={(url, alt) => {
                    setBottomSheetTitle('Xem ảnh')
                    setBottomSheetContent(
                      <div className="p-4">
                        <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
                      </div>
                    )
                    setShowBottomSheet(true)
                  }}
                  onDelete={() => {
                    // TODO: Implement message deletion
                    console.log('Delete message:', message.id)
                  }}
                >
                  {/* Product Carousel */}
                  {message.productList && message.productList.length > 0 && (
                    <div className="mt-3">
                      <ProductCarousel
                        products={message.productList}
                        onTryOn={handleTryOnApi}
                        onBuy={(url) => window.open(url, '_blank')}
                        onImageClick={(url, alt) => {
                          setBottomSheetTitle('Xem sản phẩm')
                          setBottomSheetContent(
                            <div className="p-4">
                              <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
                            </div>
                          )
                          setShowBottomSheet(true)
                        }}
                        tryOnLoading={tryOnLoading}
                        tryOnResults={tryOnResults}
                        title="Sản phẩm gợi ý"
                        maxItems={2}
                      />
                    </div>
                  )}
                </MobileMessageBubble>
              ) : (
                <div className={`flex items-end gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* Avatar */}
              {message.type !== 'user' && (
                <div className="w-10 h-10 bg-pink-400 border-4 border-black flex items-center justify-center text-black text-xs font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <SparklesIcon className="w-5 h-5" />
                </div>
              )}
              <div className={`max-w-[70%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {(message.content?.trim() || (message.actions && message.actions.length > 0) || message.image) && (
                <div
                  className={`rounded-2xl px-4 py-3 shadow-md ${
                    message.type === 'user' ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-tr-md' : 'bg-white text-gray-900 border border-amber-200 rounded-tl-md'
                  }`}
                >
                    {message.content?.trim() && (
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content
                      .replace(/┌([^┐]*)┐/g, '')
                      .replace(/└([^┘]*)┘/g, '')
                      .replace(/🖼️\s*\[([^\]]+)\]/g, '')
                      .replace(/\[Thử ngay\]/g, '')
                      .replace(/\[Mua ngay\]/g, '')
                          // unwrap markdown emphasis like *text*, **text**, ***text***
                          .replace(/\*{1,3}([^*][^]*?)\*{1,3}/g, '$1')
                          // remove leftover multiple asterisks (e.g., *** separators)
                          .replace(/\*{3,}/g, '')
                          // remove markdown headings like ### Title
                          .replace(/^#{1,6}\s*/gmi, '')
                          // remove "- Link sản phẩm: ..." lines (already have card)
                          .replace(/^\s*-\s*Link\s*sản\s*phẩm:.*$/gmi, '')
                          // remove inline code fences/backticks for plain render
                          .replace(/`{1,3}([^`]*?)`{1,3}/g, '$1')
                          // compress extra blank lines left after removals
                          .replace(/\n{3,}/g, '\n\n')
                          .trim()
                    }
                  </div>
                    )}

                    {ENABLE_ACTIONS && message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          className="text-xs px-3 py-1 rounded-full border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* User uploaded image */}
                  {message.image && (
                    <div className="mt-3">
                      <img
                        src={message.image}
                        alt="Uploaded"
                        className="max-w-full h-auto rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                            onClick={() => {
                              if (isCompact) {
                                setBottomSheetTitle('Xem ảnh')
                                setBottomSheetContent(
                                  <div className="p-4">
                                    <img src={message.image!} alt="Ảnh đã tải lên" className="w-full h-auto rounded-lg" />
                                  </div>
                                )
                                setShowBottomSheet(true)
                              } else {
                                setShowImageModal({ url: message.image!, alt: 'Ảnh đã tải lên' })
                              }
                            }}
                      />
                    </div>
                  )}

                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-amber-100' : 'text-gray-500'}`}>
                    {ensureDate(message.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                )}

                {/* Product Card using new component */}
                {message.product && (
                  <div className="mt-4 space-y-2">
                    <ProductCard 
                      product={{
                        name: message.product.name,
                        price: message.product.price,
                        description: message.product.whyRecommend,
                        image: message.product.images?.[0],
                        productUrl: message.product.productUrl
                      }}
                      onTryOn={handleTryOnApi}
                      tryOnLoading={tryOnLoading}
                      tryOnResults={tryOnResults}
                      onImageClick={(url, alt) => {
                        if (isCompact) {
                          setBottomSheetTitle('Xem sản phẩm')
                          setBottomSheetContent(
                            <div className="p-4">
                              <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
                            </div>
                          )
                          setShowBottomSheet(true)
                        } else {
                          setShowImageModal({ url, alt })
                        }
                      }}
                      onBuy={(url) => window.open(url, '_blank')}
                    />
                    {/* AI Try-on button */}
                    {message.product?.images?.[0] && (
                      <button
                        onClick={() => handleTryOnApi(message.product?.images?.[0] || '')}
                        disabled={tryOnLoading === message.product?.images?.[0]}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                      >
                        {tryOnLoading === message.product?.images?.[0] ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Thử sản phẩm này bằng AI
                          </>
                        )}
                          </button>
                        )}
                      </div>
                )}

                {/* Product Carousel */}
                {message.productList && message.productList.length > 0 && (
                  <div className="mt-3">
                    <ProductCarousel
                      products={message.productList}
                      onTryOn={handleTryOnApi}
                      onBuy={(url) => window.open(url, '_blank')}
                      onImageClick={(url, alt) => {
                        if (isCompact) {
                          setBottomSheetTitle('Xem sản phẩm')
                          setBottomSheetContent(
                            <div className="p-4">
                              <img src={url} alt={alt} className="w-full h-auto rounded-lg" />
                          </div>
                          )
                          setShowBottomSheet(true)
                        } else {
                          setShowImageModal({ url, alt })
                        }
                      }}
                      tryOnLoading={tryOnLoading}
                      tryOnResults={tryOnResults}
                      title="Sản phẩm gợi ý"
                      maxItems={3}
                    />
                  </div>
                )}
              </div>
              {/* Avatar placeholder on the right for user */}
              {message.type === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-900/90 text-white flex items-center justify-center text-[10px] shadow">Bạn</div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <TypingIndicatorVariant 
            type={selectedImage ? 'analyzing' : 'thinking'}
            isVisible={isLoading}
          />
        )}

        <div ref={messagesEndRef} />
        
        {/* Smooth scroll to bottom */}
        <SmoothScrollToBottom 
          messagesEndRef={messagesEndRef} 
          shouldScroll={messages.length > 0} 
        />
              </div>

      {/* Input */}
      {isCompact ? (
        <MobileChatInput
              value={inputValue}
          onChange={setInputValue}
          onSubmit={(message) => {
            setInputValue(message)
            handleSubmit({ preventDefault: () => {}, stopPropagation: () => {} } as React.FormEvent)
          }}
          onImageSelect={(file) => {
            if (file) {
              setSelectedImage(file)
              const reader = new FileReader()
              reader.onloadend = () => {
                setImagePreview(reader.result as string)
              }
              reader.readAsDataURL(file)
            }
          }}
          isLoading={isLoading}
          placeholder="Nhập tin nhắn..."
          selectedImage={selectedImage}
          onRemoveImage={removeImage}
          suggestions={[
            'Gợi ý outfit công sở thoáng mát',
            'Phân tích giúp mình chiếc áo polo này',
            'Set đồ đi chơi cuối tuần'
          ]}
          onSuggestionClick={(suggestion) => setInputValue(suggestion)}
        />
      ) : (
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={(message) => {
            setInputValue(message)
            handleSubmit({ preventDefault: () => {}, stopPropagation: () => {} } as React.FormEvent)
          }}
          onImageSelect={(file) => {
            if (file) {
              setSelectedImage(file)
              const reader = new FileReader()
              reader.onloadend = () => {
                setImagePreview(reader.result as string)
              }
              reader.readAsDataURL(file)
            }
          }}
          isLoading={isLoading}
              placeholder="Nhập câu hỏi thời trang nam hoặc tải ảnh trang phục để phân tích..."
          selectedImage={selectedImage}
          onRemoveImage={removeImage}
          suggestions={[
            'Gợi ý outfit công sở thoáng mát',
            'Phân tích giúp mình chiếc áo polo này',
            'Set đồ đi chơi cuối tuần'
          ]}
          onSuggestionClick={(suggestion) => setInputValue(suggestion)}
        />
      )}


          {/* Clarify UI when pending */}
          {pendingClarify && (
            <div className="mt-2 flex flex-wrap gap-2">
              {pendingClarify?.type === 'season' && (
                <>
                  <button onClick={() => handleClarifyResponse('winter')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Mùa đông</button>
                  <button onClick={() => handleClarifyResponse('summer')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Mùa hè</button>
                  <button onClick={() => handleClarifyResponse('fall')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Mùa thu</button>
                  <button onClick={() => handleClarifyResponse('spring')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Mùa xuân</button>
                </>
              )}
              {pendingClarify?.type === 'material' && (
                <>
                  <button onClick={() => handleClarifyResponse('len')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Len</button>
                  <button onClick={() => handleClarifyResponse('ni')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Nỉ/Fleece</button>
                  <button onClick={() => handleClarifyResponse('day')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Dạ/Tweed</button>
                  <button onClick={() => handleClarifyResponse('down')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Lông vũ/Puffer</button>
                  <button onClick={() => handleClarifyResponse('da')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">Da/Leather</button>
                </>
              )}
              {pendingClarify?.type === 'price' && (
                <>
                  <button onClick={() => handleClarifyResponse('dưới 300k')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Dưới 300k
                  </button>
                  <button onClick={() => handleClarifyResponse('300-600k')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    300k-600k
                  </button>
                  <button onClick={() => handleClarifyResponse('trên 600k')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Trên 600k
                  </button>
                </>
              )}
              {pendingClarify?.type === 'color' && (
                <>
                  <button onClick={() => handleClarifyResponse('trắng')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Trắng
                  </button>
                  <button onClick={() => handleClarifyResponse('xanh navy')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Xanh navy
                  </button>
                  <button onClick={() => handleClarifyResponse('đen')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Đen
                  </button>
                </>
              )}
              {pendingClarify?.type === 'size' && (
                <>
                  <button onClick={() => handleClarifyResponse('S')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    S
                  </button>
                  <button onClick={() => handleClarifyResponse('M')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    M
                  </button>
                  <button onClick={() => handleClarifyResponse('L')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    L
                  </button>
                </>
              )}
              {pendingClarify?.type === 'occasion' && (
                <>
                  <button onClick={() => handleClarifyResponse('đi làm')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Đi làm
                  </button>
                  <button onClick={() => handleClarifyResponse('đi chơi')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Đi chơi
                  </button>
                  <button onClick={() => handleClarifyResponse('dự tiệc')} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                    Dự tiệc
                  </button>
                </>
              )}
            </div>
          )}
      </div>
      </div>

      {/* Image Modal for zoom */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(null)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={showImageModal.url} 
              alt={showImageModal.alt}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ maxHeight: '100vh', maxWidth: '100vw' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setShowImageModal(null)}
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Try-On Confirmation Modal */}
      {showTryOnConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTryOnConfirmModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Xác nhận thử đồ ảo</h3>
            </div>
            
            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                Tính năng thử đồ ảo sẽ tốn <span className="font-bold text-amber-600">1 token</span>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  💰 Số token hiện có: <span className="font-bold">{showTryOnConfirmModal.availableTokens} token</span>
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  → Sau khi thử đồ: <span className="font-bold">{showTryOnConfirmModal.availableTokens - 1} token</span>
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Bạn có muốn tiếp tục không?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTryOnConfirmModal(null)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                ❌ Hủy
              </button>
              <button
                onClick={async () => {
                  const { productImageUrl } = showTryOnConfirmModal
                  setShowTryOnConfirmModal(null)
                  
                  try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session?.access_token) {
                      toast.error('Vui lòng đăng nhập')
                      return
                    }

                    // Deduct 1 token
                    toast.loading('Đang trừ token...', { id: 'token-deduct' })
                    
                    const tokenDeductRes = await fetch('/api/membership/tokens', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify({
                        tokensToUse: 1,
                        description: 'Virtual try-on',
                      })
                    })

                    if (!tokenDeductRes.ok) {
                      const errorData = await tokenDeductRes.json()
                      toast.error(errorData.error || 'Không thể trừ token', { id: 'token-deduct' })
                      return
                    }

                    const tokenResult = await tokenDeductRes.json()
                    toast.success(`✅ Đã trừ 1 token. Còn lại: ${tokenResult.tokens?.total_tokens || 0} token`, { id: 'token-deduct' })
                    
                    // Now execute the actual try-on
                    await executeRealTryOn(productImageUrl)
                    
                  } catch (error) {
                    console.error('Token deduction error:', error)
                    toast.error('Có lỗi xảy ra khi trừ token', { id: 'token-deduct' })
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-medium hover:from-amber-600 hover:to-yellow-600 transition-all shadow-md hover:shadow-lg"
              >
                ✅ Xác nhận (-1 token)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Micro-interactions */}
      
      <NotificationToast
        message={notificationMessage}
        type={notificationType}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />

      {/* Bottom Sheet for Mobile */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title={bottomSheetTitle}
        height="70vh"
      >
        {bottomSheetContent}
      </BottomSheet>

      {/* Phase 4: Advanced Features Panel */}
      <AnimatePresence>
        {showAdvancedFeatures && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  {activeFeature === 'quiz' && 'Trắc nghiệm phong cách'}
                  {activeFeature === 'analytics' && 'Analytics Dashboard'}
                </h2>
                <button
                  onClick={() => setShowAdvancedFeatures(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
    </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                {activeFeature === 'quiz' && (
                  <StyleQuiz
                    onComplete={handleStyleQuizComplete}
                    onClose={() => setShowAdvancedFeatures(false)}
                  />
                )}
                
                {activeFeature === 'analytics' && (
                  <AnalyticsDashboard
                    onWidgetClick={(widgetId) => console.log('Widget clicked:', widgetId)}
                    onAlertClick={(alertId) => console.log('Alert clicked:', alertId)}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Phase 4: Advanced Features Quick Access */}
      <div className="fixed bottom-4 right-4 z-30">
        <div className="flex flex-col gap-2">
          <motion.button
            onClick={() => handleAdvancedFeature('quiz')}
            className="p-3 bg-yellow-500 text-white rounded-full shadow-lg hover:bg-yellow-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Trắc nghiệm phong cách"
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={() => handleAdvancedFeature('analytics')}
            className="p-3 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Analytics Dashboard"
          >
            <ChartBarIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </>
  )
}
