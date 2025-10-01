'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Users, Star, MessageCircle, Palette, Camera, Wand2, ArrowRight, Play, CheckCircle, Crown, Shield, Bolt } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ImageSkeleton } from '../../components/SkeletonLoader'
import ShimmerButton from '../../components/ui/ShimmerButton'
import GlowCard from '../../components/ui/GlowCard'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('clothing-tryon')

  const features = [
    {
      id: 'clothing-tryon',
      title: 'Clothing Try-On',
      description: 'Change the clothing in any model photo using a reference image—whether it\'s from someone wearing the outfit or a product photo.',
      active: true
    },
    {
      id: 'model-swap',
      title: 'AI Suggestion',
      description: 'Nhận gợi ý trang phục và phong cách thời trang thông minh từ AI dựa trên ảnh của bạn hoặc link sản phẩm Shopee.',
      active: false
    },
    {
      id: 'model-creation',
      title: 'Model Creation',
      description: 'Generate realistic AI models and create on-model photos from just the product image.',
      active: false
    },
    {
      id: 'short-videos',
      title: 'Short Videos',
      description: 'Create dynamic fashion videos with AI-generated models and clothing.',
      active: false
    },
    {
      id: 'ai-editing',
      title: 'AI Photo Editing',
      description: 'Advanced photo editing tools powered by artificial intelligence.',
      active: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900" style={{ backgroundColor: '#f6f1e9' }}>
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
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
                  Products <ArrowRight className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
                <button className="text-amber-600 hover:text-amber-800 transition-colors font-medium">
                  Solutions <ArrowRight className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
                <button className="text-amber-600 hover:text-amber-800 transition-colors font-medium">Pricing</button>
                <a href="#about-us" className="text-amber-600 hover:text-amber-800 transition-colors font-medium">
                  About Us
                </a>
              </div>
            </nav>

            {/* CTA */}
            <Link href="/try-on">
              <ShimmerButton>
                Get Started
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
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
            Future of Fashion, <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent font-semibold">Today.</span>
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
                  Start Free Trial
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
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <GlowCard>
                    <Image 
                      src="/images/1.png" 
                      alt="Clothing Try-On Example 1" 
                      width={300} 
                      height={400} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </GlowCard>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <GlowCard>
                    <Image 
                      src="/images/2.png" 
                      alt="Clothing Try-On Example 2" 
                      width={300} 
                      height={400} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </GlowCard>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <GlowCard>
                    <Image 
                      src="/images/3.png" 
                      alt="Clothing Try-On Example 3" 
                      width={300} 
                      height={400} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </GlowCard>
                </motion.div>
              </motion.div>
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
      </section>

      {/* Agencies Section */}
      <section className="border-t border-amber-200 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-amber-600 uppercase tracking-wider text-sm font-semibold mb-4">FOR BRANDS</p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
              >
                Already have<br />model photos?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="text-gray-600 text-lg mb-8 leading-relaxed"
              >
                Reuse great photos by trying different clothing on the same model, 
                or change models to increase diversity.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="text-gray-600 mb-8"
              >
                <span className="text-amber-700 font-semibold bg-amber-100 px-2 py-1 rounded">NO TRAINING NEEDED</span>. Get try-on results in seconds with just 
                one reference image, no complex setup or multiple image training required.
              </motion.p>
              <div className="flex gap-4">
                <Link href="/try-on">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-6 py-3 rounded-full font-semibold hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg inline-flex items-center gap-2"
                  >
                      Try-On Studio
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-amber-300 text-amber-700 px-6 py-3 rounded-full font-semibold hover:border-amber-400 hover:bg-amber-50 transition-all inline-flex items-center gap-2"
                >
                  Swap Model
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-square" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Startups Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-square" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
            </div>

            <div>
              <p className="text-amber-600 uppercase tracking-wider text-sm font-semibold mb-4">FOR FASHION STARTUPS</p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
              >
                Don't have any<br />model photos?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="text-gray-600 text-lg mb-8 leading-relaxed"
              >
                Create realistic AI models and generate on-model photos 
                from just product images.
              </motion.p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-6 py-3 rounded-full font-semibold hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  Create AI Model
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
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
            About Us – Clothify
          </motion.h2>

          <div className="space-y-12 text-lg text-gray-700 leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              Clothify is a fashion technology platform that uses AI and AR to help you style outfits intelligently, try on virtual clothing, and shop online more easily than ever before.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              We were founded by a group of passionate young students, with the desire to solve common problems when shopping for fashion online: choosing the wrong size, colors not matching the image, difficulty styling according to personal style or occasion.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Our Mission</h3>
              <p className="mb-4">Clothify aims to deliver "Personalized Fashion – Modern Technology – Convenient Shopping" experiences for young generations (Gen Z, Millennials), helping you:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Receive smart styling suggestions based on body shape, preferences and usage occasions.</li>
                <li>Try on clothing online using realistic AI/AR technology before purchasing.</li>
                <li>Buy instantly through direct links from major e-commerce platforms like Shopee, Tiki, Lazada.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">What Makes Us Different</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Personal AI Stylist: Suggests clothing based on body shape, style, and occasions.</li>
                <li>Virtual Try-On Experience (AR): Helps you visualize clearly when wearing clothes.</li>
                <li>Fast Shopping Integration: Direct links to e-commerce platforms, no time wasted searching.</li>
                <li>Flexible Service Packages: Use for free or upgrade to VIP to unlock premium features.</li>
                <li>Fashion Community: Join styling challenges, share styles, connect with KOLs & fashion shops.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Development Journey</h3>
              <p className="mb-4">Starting from a university startup idea, Clothify has researched the market and recognized the urgent need of young users for a smart styling tool.</p>
              <p className="mb-4">The product has been built through multiple stages: research – AI development – user-friendly website/app design – testing – continuous improvement based on real feedback.</p>
              <p>We collaborate with KOLs, small fashion shops and fashion-loving communities to expand the ecosystem and create value for both buyers and sellers.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Future Vision</h3>
              <p className="mb-4">Clothify doesn't stop at Vietnam, but also aims to expand to Southeast Asia – where the fashion e-commerce market is growing strongly.</p>
              <p className="mb-4">In the future, we will:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Launch a mobile application with optimized experience.</li>
                <li>Develop styling features by events, profession, personality.</li>
                <li>Collaborate closely with brands and retailers to diversify products.</li>
                <li>Build a young, creative and sustainable fashion community.</li>
              </ul>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              className="text-center text-xl font-semibold text-amber-800"
            >
              ✨ With Clothify, fashion shopping is no longer a worry about choosing wrong, but becomes a personalized, fun and inspiring journey.
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
              <Link href="/try-on" className="hover:text-amber-800 transition-colors font-medium">Try-On</Link>
              <Link href="/wardrobe" className="hover:text-amber-800 transition-colors font-medium">Wardrobe</Link>
              <Link href="/membership" className="hover:text-amber-800 transition-colors font-medium">Plans</Link>
              <Link href="/profile" className="hover:text-amber-800 transition-colors font-medium">Profile</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-amber-200 text-center text-amber-600">
            <p>&copy; 2025 Clothify. All rights reserved by Kiru.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
