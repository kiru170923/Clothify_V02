'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline'
import { SparklesIcon, BoltIcon, SwatchIcon, UserGroupIcon, CameraIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import { ImageSkeleton } from '../../components/SkeletonLoader'

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
      title: 'Model Swap',
      description: 'Replace models in existing photos while keeping the same clothing and pose.',
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">CLOTHIFY</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-6">
                <button className="text-gray-300 hover:text-white transition-colors">
                  Products <ArrowRightIcon className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Solutions <ArrowRightIcon className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
                <button className="text-gray-300 hover:text-white transition-colors">Pricing</button>
                <button className="text-gray-300 hover:text-white transition-colors">
                  Resources <ArrowRightIcon className="w-4 h-4 inline ml-1 rotate-90" />
                </button>
              </div>
            </nav>

            {/* CTA */}
            <Link href="/try-on">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Go to app
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
          >
            Create realistic images of<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              your clothes, worn by anyone
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Leading research in virtual try-on technology,<br />
            transforming fashion campaigns and consumer experiences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-4"
          >
            <Link href="/try-on">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Get started for free
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          <p className="text-gray-500 text-sm">No credit card required</p>
        </div>

        {/* Feature Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16"
        >
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === feature.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-800 rounded-2xl overflow-hidden"
            >
              <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
            </motion.div>
            <motion.div
              key={`${activeTab}-2`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-800 rounded-2xl overflow-hidden"
            >
              <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
            </motion.div>
            <motion.div
              key={`${activeTab}-3`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-800 rounded-2xl overflow-hidden"
            >
              <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Agencies Section */}
      <section className="border-t border-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gray-500 uppercase tracking-wider text-sm font-semibold mb-4">AGENCIES</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Already have on-model<br />photos ?
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Re-use a great shot by trying-on more clothes on the same model, 
                or change just the model for more diversity.
              </p>
              <p className="text-gray-400 mb-8">
                <span className="text-white font-semibold">NO TRAINING NEEDED</span>. Get try-on results in seconds using a 
                single reference image, with no lengthy setup or multi-image training required.
              </p>
              <div className="flex gap-4">
                <Link href="/try-on">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                  >
                    Try-On Studio
                    <ArrowRightIcon className="w-4 h-4" />
                  </motion.button>
                </Link>
                <button className="border border-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:border-gray-400 transition-colors inline-flex items-center gap-2">
                  Model Swap
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-gray-800 rounded-2xl overflow-hidden"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gray-800 rounded-2xl overflow-hidden"
              >
                <ImageSkeleton aspectRatio="aspect-square" className="bg-gray-700" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-800 rounded-2xl overflow-hidden"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
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
                transition={{ duration: 0.6 }}
                className="bg-gray-800 rounded-2xl overflow-hidden"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gray-800 rounded-2xl overflow-hidden"
              >
                <ImageSkeleton aspectRatio="aspect-square" className="bg-gray-700" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-800 rounded-2xl overflow-hidden"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-gray-700" />
              </motion.div>
            </div>

            <div>
              <p className="text-gray-500 uppercase tracking-wider text-sm font-semibold mb-4">FASHION STARTUPS</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Don't have on-model<br />photos ?
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Generate realistic AI models and create on-model photos from 
                just the product image.
              </p>
              <div className="flex gap-4">
                <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
                  Model Creation
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">CLOTHIFY</span>
            </div>

            <div className="flex items-center gap-6 text-gray-400">
              <Link href="/try-on" className="hover:text-white transition-colors">Try On</Link>
              <Link href="/wardrobe" className="hover:text-white transition-colors">Wardrobe</Link>
              <Link href="/membership" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>&copy; 2024 Clothify. All rights reserved. Powered by AI Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
