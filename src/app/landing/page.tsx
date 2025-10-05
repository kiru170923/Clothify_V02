'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Sparkles, Zap, Users, Star, MessageCircle, Palette, Camera, Wand2, ArrowRight, Play, CheckCircle, Crown, Shield, Bolt, TrendingUp, Heart, Gift, ChevronDown, Quote, Award, Target, Clock, Smartphone } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ImageSkeleton } from '../../components/SkeletonLoader'
import ShimmerButton from '../../components/ui/ShimmerButton'
import GlowCard from '../../components/ui/GlowCard'

// Floating particles component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([])
  
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('clothing-tryon')
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTryOns: 0,
    satisfactionRate: 95,
    recentActivity: 0
  })
  const { scrollYProgress } = useScroll()
  const headerY = useTransform(scrollYProgress, [0, 0.1], [0, -50])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        if (data.error) {
          console.error('Error fetching stats:', data.error)
          return
        }
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  const features = [
    {
      id: 'clothing-tryon',
      title: 'Thử Đồ Ảo',
      description: 'Thay đổi trang phục trong bất kỳ ảnh model nào bằng cách sử dụng ảnh tham chiếu—dù là từ người đang mặc outfit hoặc ảnh sản phẩm.',
      active: true
    },
    {
      id: 'ai-chatbot',
      title: 'Stylist AI',
      description: 'Chatbot thời trang thông minh tư vấn phong cách, gợi ý trang phục và phân tích outfit từ ảnh.',
      active: false
    },
    {
      id: 'wardrobe',
      title: 'Tủ Đồ Số',
      description: 'Quản lý tủ đồ cá nhân với AI phân tích trang phục, phân loại và gợi ý phối đồ.',
      active: false
    },
    {
      id: 'model-generation',
      title: 'Tạo Model',
      description: 'Tạo ra các model AI chân thực từ mô tả hoặc upload ảnh để sử dụng trong thử đồ.',
      active: false
    },
    {
      id: 'history',
      title: 'Lịch Sử',
      description: 'Lưu trữ và quản lý tất cả ảnh đã thử đồ, dễ dàng xem lại và chia sẻ.',
      active: false
    }
  ]

  const testimonials = [
    {
      name: "Minh Anh",
      role: "Fashion Blogger",
      content: "Clothify đã thay đổi cách mình mua sắm! Thử đồ ảo quá xuất sắc, giúp mình tự tin hơn khi đặt hàng online.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Phúc Thành",
      role: "Sinh viên", 
      content: "Stylist AI của Clothify đưa ra những gợi ý rất phù hợp với phong cách và ngân sách sinh viên của mình.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Thu Hà",
      role: "Nhân viên văn phòng",
      content: "Tính năng tủ đồ số và gợi ý phối đồ thật tiện lợi. Giờ mình không còn phải lo lắng về việc mix&match nữa!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ]

  const statsData = [
    { 
      number: stats.totalUsers >= 1000 ? `${Math.floor(stats.totalUsers / 1000)}K+` : `${stats.totalUsers}+`, 
      label: "Người dùng", 
      icon: Users 
    },
    { 
      number: stats.totalTryOns >= 1000 ? `${Math.floor(stats.totalTryOns / 1000)}K+` : `${stats.totalTryOns}+`, 
      label: "Lần thử đồ", 
      icon: Camera 
    },
    { 
      number: `${stats.satisfactionRate}%`, 
      label: "Độ hài lòng", 
      icon: Heart 
    },
    { 
      number: "24/7", 
      label: "Hỗ trợ AI", 
      icon: Clock 
    }
  ]

  const faqData = [
    {
      question: "Clothify có miễn phí không?",
      answer: "Hiện tại Clothify sử dụng hệ thống token. Bạn có thể mua token để sử dụng các tính năng thử đồ và AI stylist."
    },
    {
      question: "Tính năng try-on có chính xác không?",
      answer: "Clothify sử dụng AI tiên tiến từ KIE.AI để đảm bảo độ chính xác cao. Kết quả try-on phản ánh 90-95% hiện thực so với việc mặc thật."
    },
    {
      question: "Tôi có thể sử dụng trên mobile không?",
      answer: "Hiện tại Clothify hoạt động tốt trên web browser trên cả desktop và mobile. Giao diện được tối ưu responsive cho mọi thiết bị."
    },
    {
      question: "Stylist AI có thể làm gì?",
      answer: "Stylist AI có thể tư vấn phong cách, gợi ý trang phục, phân tích outfit từ ảnh, và giúp bạn phối đồ phù hợp với dịp sử dụng."
    },
    {
      question: "Tủ đồ số hoạt động như thế nào?",
      answer: "Bạn có thể upload ảnh trang phục, AI sẽ phân tích và phân loại tự động. Sau đó bạn có thể quản lý, tìm kiếm và nhận gợi ý phối đồ."
    }
  ]

  const pricingPlans = [
    {
      name: "Standard",
      price: "59K",
      period: "/tháng",
      features: [
        "30 ảnh/tháng",
        "Chất lượng HD",
        "Hỗ trợ email",
        "Lưu lịch sử cơ bản"
      ],
      popular: false,
      color: "from-gray-400 to-gray-600"
    },
    {
      name: "Medium",
      price: "99K",
      period: "/tháng", 
      features: [
        "50 ảnh/tháng",
        "Chất lượng HD+",
        "Hỗ trợ ưu tiên",
        "Lưu trữ 100 ảnh",
        "Stylist AI nâng cao"
      ],
      popular: true,
      color: "from-amber-400 to-yellow-400"
    },
    {
      name: "Premium",
      price: "159K", 
      period: "/tháng",
      features: [
        "100 ảnh/tháng",
        "Chất lượng 4K",
        "Hỗ trợ 24/7",
        "Lưu trữ không giới hạn",
        "Tính năng API",
        "Tủ đồ số nâng cao"
      ],
      popular: false,
      color: "from-purple-400 to-pink-400"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900" style={{ backgroundColor: '#f6f1e9' }}>
      {/* Header */}
      <motion.header 
        style={{ y: headerY }}
        className="border-b border-amber-200 bg-white/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="./favicon.ico.png" alt="Clothify" className="w-16 h-16 rounded-lg object-cover" />
              <span className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">CLOTHIFY</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                <button className="text-amber-600 hover:text-amber-800 transition-colors font-medium">
                  Sản phẩm <ArrowRight className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
                <button className="text-amber-600 hover:text-amber-800 transition-colors font-medium">
                  Giải pháp <ArrowRight className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
                <button className="text-amber-600 hover:text-amber-800 transition-colors font-medium">Bảng giá</button>
                <a href="#about-us" className="text-amber-600 hover:text-amber-800 transition-colors font-medium">
                  Về chúng tôi
                </a>
              </div>
            </nav>

            {/* CTA */}
            <Link href="/try-on">
              <ShimmerButton>
                Bắt đầu
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* <FloatingParticles /> */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
        <div className="text-center overflow-x-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
          >
            <span className="permanent-marker-regular text-6xl md:text-8xl bg-gradient-to-r from-amber-300 to-amber-900 bg-clip-text text-transparent whitespace-nowrap inline-block px-4 pr-8">
              CLOTHIFY
            </span><br />
            <span className="text-3xl md:text-3xl text-gray-600">
            Tương lai thời trang, <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent font-semibold">hôm nay.</span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {/* Công nghệ thử đồ ảo tiên tiến nhất,<br />
            biến đổi trải nghiệm mua sắm và thời trang của bạn. */}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mb-4"
          >
            <Link href="/try-on">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-8 py-4 rounded-full font-semibold text-lg hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg inline-flex items-center gap-2"
              >
                  Bắt đầu miễn phí
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* <p className="text-amber-600 text-sm font-medium">Không cần thẻ tín dụng</p> */}
        </div>

        {/* Feature Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === feature.id
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                    : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 hover:from-amber-200 hover:to-yellow-200 hover:text-amber-800'
                }`}
              >
                {feature.title}
              </button>
            ))}
          </div>

          {/* Feature Description */}
          <div className="text-center mb-12">
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              {features.find(f => f.id === activeTab)?.description}
            </p>
          </div>

          {/* Demo Images */}
          <AnimatePresence>
            {activeTab === 'clothing-tryon' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="overflow-hidden">
                  <div className="relative rounded-2xl p-2 bg-white border border-amber-100 shadow-lg hover:shadow-xl transition-shadow">
                    <Image 
                      src="/images/1.png" 
                      alt="Clothing Try-On Example 1" 
                      width={300} 
                      height={400} 
                      className="w-full h-full object-cover rounded-xl"
                      priority
                      quality={100}
                      style={{ filter: 'none', opacity: 1 }}
                    />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="relative rounded-2xl p-2 bg-white border border-amber-100 shadow-lg hover:shadow-xl transition-shadow">
                    <Image 
                      src="/images/2.png" 
                      alt="Clothing Try-On Example 2" 
                      width={300} 
                      height={400} 
                      className="w-full h-full object-cover rounded-xl"
                      priority
                      quality={100}
                      style={{ filter: 'none', opacity: 1 }}
                    />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="relative rounded-2xl p-2 bg-white border border-amber-100 shadow-lg hover:shadow-xl transition-shadow">
                    <Image 
                      src="/images/3.png" 
                      alt="Clothing Try-On Example 3" 
                      width={300} 
                      height={400} 
                      className="w-full h-full object-cover rounded-xl"
                      priority
                      quality={100}
                      style={{ filter: 'none', opacity: 1 }}
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'model-swap' && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all col-span-full md:col-span-3"
              >
                <Image 
                  src="/images/image.png" 
                  alt="AI Suggestion Example" 
                  width={720} 
                  height={540} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="w-8 h-8" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2, type: "spring" }}
                  className="text-3xl md:text-4xl font-bold mb-2"
                >
                  {stat.number}
                </motion.div>
                <div className="text-amber-100 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Khách hàng nói gì về Clothify
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Hàng nghìn người dùng đã tin tưởng và yêu thích Clothify
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-amber-400 mb-4" />
                <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.content}</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-amber-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Chọn gói phù hợp với bạn
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Từ miễn phí đến chuyên nghiệp, chúng tôi có gói dịch vụ cho mọi nhu cầu
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className={`relative bg-white border-2 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all ${
                  plan.popular ? 'border-amber-400 transform scale-105' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-4 py-2 rounded-full text-sm font-bold">
                      POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 px-6 rounded-full font-semibold transition-all ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 hover:from-amber-500 hover:to-yellow-500' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Free' ? 'Bắt đầu miễn phí' : 'Chọn gói này'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Câu hỏi thường gặp
            </h2>
            <p className="text-gray-600 text-lg">
              Những câu hỏi phổ biến từ người dùng Clothify
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border border-amber-200 rounded-lg overflow-hidden"
              >
                <motion.button
                  onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                  className="w-full text-left p-6 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all flex justify-between items-center"
                  whileHover={{ backgroundColor: "#fef3c7" }}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: activeFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-amber-600" />
                  </motion.div>
                </motion.button>
                <AnimatePresence>
                  {activeFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white"
                    >
                      <p className="p-6 text-gray-700 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-yellow-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Sẵn sàng khám phá tương lai thời trang?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl mb-8 text-amber-100"
          >
            Tham gia cùng hàng nghìn người dùng đã tin tưởng Clothify
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/try-on">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-amber-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-lg inline-flex items-center gap-2"
              >
                Bắt đầu ngay - Miễn phí
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>


      {/* About Us Section */}
      <section id="about-us" className="py-20 bg-amber-50 border-t border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-extrabold text-center mb-12 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent px-4 py-2"
          >
            Về chúng tôi – Clothify
          </motion.h2>

          <div className="space-y-12 text-lg text-gray-700 leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              Clothify là nền tảng công nghệ thời trang sử dụng AI và AR để giúp bạn phối đồ thông minh, thử trang phục ảo và mua sắm trực tuyến dễ dàng hơn bao giờ hết.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Chúng tôi được thành lập bởi một nhóm sinh viên trẻ đầy đam mê, với mong muốn giải quyết những vấn đề thường gặp khi mua sắm thời trang trực tuyến: chọn sai size, màu sắc không khớp với hình ảnh, khó khăn trong việc phối đồ theo phong cách cá nhân hoặc dịp sử dụng.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Sứ mệnh của chúng tôi</h3>
              <p className="mb-4">Clothify hướng tới mang đến trải nghiệm "Thời trang cá nhân hóa – Công nghệ hiện đại – Styling thông minh" cho thế hệ trẻ, giúp bạn:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Thử trang phục ảo với công nghệ AI tiên tiến từ KIE.AI.</li>
                <li>Nhận tư vấn từ Stylist AI thông minh về phong cách và phối đồ.</li>
                <li>Quản lý tủ đồ số với AI phân tích và phân loại trang phục tự động.</li>
                <li>Tạo model AI chân thực để sử dụng trong thử đồ.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Điều làm nên sự khác biệt</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Công nghệ AI tiên tiến: Sử dụng KIE.AI để tạo kết quả thử đồ chân thực và chính xác.</li>
                <li>Stylist AI thông minh: Chatbot có thể tư vấn phong cách, phân tích outfit và gợi ý phối đồ.</li>
                <li>Tủ đồ số thông minh: AI phân tích và phân loại trang phục tự động, giúp quản lý tủ đồ hiệu quả.</li>
                <li>Hệ thống token linh hoạt: Mua token để sử dụng các tính năng theo nhu cầu.</li>
                <li>Giao diện thân thiện: Responsive design hoạt động tốt trên mọi thiết bị.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Hành trình phát triển</h3>
              <p className="mb-4">Clothify được phát triển bởi nhóm sinh viên đam mê công nghệ và thời trang, với mong muốn giải quyết những khó khăn trong việc mua sắm và phối đồ online.</p>
              <p className="mb-4">Sản phẩm được xây dựng với các công nghệ hiện đại: Next.js, Supabase, KIE.AI và các công cụ AI tiên tiến để mang đến trải nghiệm tốt nhất cho người dùng.</p>
              <p>Chúng tôi tập trung vào việc phát triển các tính năng core như thử đồ ảo, AI stylist và tủ đồ số để phục vụ nhu cầu thực tế của người dùng Việt Nam.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Tầm nhìn tương lai</h3>
              <p className="mb-4">Clothify hướng tới trở thành nền tảng thời trang AI hàng đầu tại Việt Nam, phục vụ nhu cầu ngày càng tăng của người dùng về công nghệ thời trang thông minh.</p>
              <p className="mb-4">Trong tương lai, chúng tôi sẽ:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Nâng cấp công nghệ AI để cải thiện độ chính xác của thử đồ.</li>
                <li>Phát triển thêm tính năng phân tích body shape và gợi ý phong cách cá nhân hóa.</li>
                <li>Tích hợp với các sàn thương mại điện tử để hỗ trợ mua sắm trực tiếp.</li>
                <li>Xây dựng cộng đồng người dùng để chia sẻ kinh nghiệm và phong cách.</li>
              </ul>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              className="text-center text-xl font-semibold text-amber-800"
            >
              ✨ Với Clothify, mua sắm thời trang không còn là nỗi lo chọn sai, mà trở thành một hành trình cá nhân hóa, vui vẻ và truyền cảm hứng.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <img src="./favicon.ico.png" alt="Clothify" className="w-16 h-16 rounded-lg object-cover" />
              <span className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">CLOTHIFY</span>
            </div>

            <div className="flex items-center gap-6 text-amber-600">
              <Link href="/try-on" className="hover:text-amber-800 transition-colors font-medium">Thử đồ</Link>
              <Link href="/wardrobe" className="hover:text-amber-800 transition-colors font-medium">Tủ đồ</Link>
              <Link href="/membership" className="hover:text-amber-800 transition-colors font-medium">Gói dịch vụ</Link>
              <Link href="/profile" className="hover:text-amber-800 transition-colors font-medium">Hồ sơ</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-amber-200 text-center text-amber-600">
            <p>&copy; 2025 Clothify. Tất cả quyền được bảo lưu bởi Kiru.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
