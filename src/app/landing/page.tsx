'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Users, Star, MessageCircle, Palette, Camera, Wand2, ArrowRight, Play, CheckCircle, Crown, Shield, Bolt } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-gray-900" style={{ backgroundColor: '#f6f1e9' }}>
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
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
                <button className="text-amber-600 hover:text-amber-800 transition-colors font-medium">Giá cả</button>
                <a href="#about-us" className="text-amber-600 hover:text-amber-800 transition-colors font-medium">
                  Về Chúng Tôi
                </a>
              </div>
            </nav>

            {/* CTA */}
            <Link href="/try-on">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-6 py-2 rounded-full font-semibold hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg"
              >
                Sử dụng ngay
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
            Tạo hình ảnh thời trang thực tế với<br />
            <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              AI thông minh hàng đầu Việt Nam
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Công nghệ thử đồ ảo tiên tiến nhất,<br />
            biến đổi trải nghiệm mua sắm và thời trang của bạn.
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
                className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-8 py-4 rounded-full font-semibold text-lg hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg inline-flex items-center gap-2"
              >
                Bắt đầu miễn phí
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          <p className="text-amber-600 text-sm font-medium">Không cần thẻ tín dụng</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
            >
              <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
            </motion.div>
            <motion.div
              key={`${activeTab}-2`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
            >
              <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
            </motion.div>
            <motion.div
              key={`${activeTab}-3`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
            >
              <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Agencies Section */}
      <section className="border-t border-amber-200 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-amber-600 uppercase tracking-wider text-sm font-semibold mb-4">CHO CÁC THƯƠNG HIỆU</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Đã có ảnh model<br />sẵn rồi?
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Tái sử dụng những bức ảnh tuyệt vời bằng cách thử nhiều trang phục khác nhau 
                trên cùng một model, hoặc thay đổi model để tăng tính đa dạng.
              </p>
              <p className="text-gray-600 mb-8">
                <span className="text-amber-700 font-semibold bg-amber-100 px-2 py-1 rounded">KHÔNG CẦN TRAINING</span>. Nhận kết quả thử đồ trong vài giây chỉ với 
                một ảnh tham khảo, không cần setup phức tạp hay training nhiều ảnh.
              </p>
              <div className="flex gap-4">
                <Link href="/try-on">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-6 py-3 rounded-full font-semibold hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg inline-flex items-center gap-2"
                  >
                    Studio Thử Đồ
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <button className="border-2 border-amber-300 text-amber-700 px-6 py-3 rounded-full font-semibold hover:border-amber-400 hover:bg-amber-50 transition-all inline-flex items-center gap-2">
                  Đổi Model
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-square" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
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
                transition={{ duration: 0.6 }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-square" className="bg-amber-100" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <ImageSkeleton aspectRatio="aspect-[3/4]" className="bg-amber-100" />
              </motion.div>
            </div>

            <div>
              <p className="text-amber-600 uppercase tracking-wider text-sm font-semibold mb-4">CHO STARTUP THỜI TRANG</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Chưa có ảnh model<br />nào?
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Tạo ra những AI model thực tế và tạo ảnh trên model chỉ 
                từ ảnh sản phẩm đơn thuần.
              </p>
              <div className="flex gap-4">
                <button className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-6 py-3 rounded-full font-semibold hover:from-amber-500 hover:to-yellow-500 transition-all shadow-lg inline-flex items-center gap-2">
                  Tạo Model AI
                  <ArrowRight className="w-4 h-4" />
                </button>
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
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-extrabold text-center mb-12 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent"
          >
            Về Chúng Tôi – Clothify
          </motion.h2>

          <div className="space-y-12 text-lg text-gray-700 leading-relaxed">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Clothify là nền tảng công nghệ thời trang ứng dụng AI và AR giúp bạn phối đồ thông minh, thử trang phục ảo và mua sắm trực tuyến dễ dàng hơn bao giờ hết.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Chúng tôi được thành lập bởi một nhóm sinh viên trẻ đầy nhiệt huyết, với mong muốn giải quyết những vấn đề quen thuộc khi mua sắm thời trang online: chọn sai size, màu sắc không giống ảnh, khó phối đồ theo phong cách cá nhân hay dịp sử dụng.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Sứ mệnh của chúng tôi</h3>
              <p className="mb-4">Clothify hướng đến việc mang lại trải nghiệm “Thời trang cá nhân hóa – Công nghệ hiện đại – Mua sắm tiện lợi” cho thế hệ trẻ (Gen Z, Millennials), giúp bạn:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Nhận gợi ý phối đồ thông minh dựa trên vóc dáng, sở thích và hoàn cảnh sử dụng.</li>
                <li>Thử trang phục trực tuyến bằng công nghệ AI/AR một cách chân thực trước khi mua.</li>
                <li>Mua ngay qua liên kết trực tiếp từ các sàn thương mại điện tử lớn như Shopee, Tiki, Lazada.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Điểm khác biệt</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>AI Stylist cá nhân: Gợi ý trang phục theo vóc dáng, phong cách, sự kiện.</li>
                <li>Trải nghiệm Thử Ảo (AR): Giúp bạn hình dung rõ ràng khi mặc đồ.</li>
                <li>Tích hợp mua sắm nhanh: Liên kết trực tiếp với các sàn TMĐT, không mất thời gian tìm kiếm.</li>
                <li>Gói dịch vụ linh hoạt: Sử dụng miễn phí hoặc nâng cấp VIP để mở khóa tính năng cao cấp.</li>
                <li>Cộng đồng thời trang: Tham gia thử thách phối đồ, chia sẻ phong cách, kết nối cùng KOLs & shop thời trang.</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Hành trình phát triển</h3>
              <p className="mb-4">Khởi đầu từ ý tưởng khởi nghiệp tại đại học, Clothify đã nghiên cứu thị trường và nhận ra nhu cầu cấp thiết của người dùng trẻ về một công cụ phối đồ thông minh.</p>
              <p className="mb-4">Sản phẩm được xây dựng qua nhiều giai đoạn: khảo sát – phát triển AI – thiết kế website/app thân thiện – chạy thử nghiệm – cải tiến liên tục dựa trên phản hồi thực tế.</p>
              <p>Chúng tôi hợp tác cùng KOLs, shop thời trang nhỏ và cộng đồng yêu thời trang để mở rộng hệ sinh thái và tạo giá trị cho cả người mua lẫn người bán.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-amber-800 mb-4">Tầm nhìn tương lai</h3>
              <p className="mb-4">Clothify không chỉ dừng lại ở Việt Nam, mà còn hướng tới mở rộng ra khu vực Đông Nam Á – nơi thị trường thương mại điện tử thời trang đang phát triển mạnh.</p>
              <p className="mb-4">Trong tương lai, chúng tôi sẽ:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Ra mắt ứng dụng di động với trải nghiệm tối ưu.</li>
                <li>Phát triển tính năng phối đồ theo sự kiện, nghề nghiệp, tính cách.</li>
                <li>Hợp tác chặt chẽ với thương hiệu và nhà bán lẻ để đa dạng hóa sản phẩm.</li>
                <li>Xây dựng cộng đồng thời trang trẻ trung, sáng tạo và bền vững.</li>
              </ul>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-center text-xl font-semibold text-amber-800"
            >
              ✨ Với Clothify, mua sắm thời trang không còn là nỗi lo chọn sai, mà trở thành hành trình trải nghiệm cá nhân hóa, thú vị và tràn đầy cảm hứng.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">CLOTHIFY</span>
            </div>

            <div className="flex items-center gap-6 text-amber-600">
              <Link href="/try-on" className="hover:text-amber-800 transition-colors font-medium">Thử Đồ</Link>
              <Link href="/wardrobe" className="hover:text-amber-800 transition-colors font-medium">Tủ Đồ</Link>
              <Link href="/membership" className="hover:text-amber-800 transition-colors font-medium">Gói cước</Link>
              <Link href="/profile" className="hover:text-amber-800 transition-colors font-medium">Hồ sơ</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-amber-200 text-center text-amber-600">
            <p>&copy; 2025 Clothify. Bản quyền thuộc về Kiru.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
