/**
 * QR Code Export Utility
 * Supports: Plain QR, Branded QR (with image + logo)
 */

interface ExportOptions {
  qrCode: string           // QR code data (URL)
  clothingImageUrl?: string // Optional: clothing image
  format: 'plain' | 'branded-simple' | 'branded-full'
  size?: number            // QR size in pixels
  fileName?: string
}

/**
 * Export plain QR code
 */
export async function exportPlainQR(options: ExportOptions): Promise<void> {
  const { qrCode, size = 512, fileName = 'clothify-qr.png' } = options

  // Create QR canvas
  const QRCode = (await import('qrcode')).default
  const canvas = document.createElement('canvas')
  
  await QRCode.toCanvas(canvas, qrCode, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  })
}

/**
 * Export branded QR (Simple: QR in corner of clothing image)
 */
export async function exportBrandedSimpleQR(options: ExportOptions): Promise<void> {
  const { qrCode, clothingImageUrl, size = 256, fileName = 'clothify-branded-qr.png' } = options

  if (!clothingImageUrl) {
    throw new Error('Clothing image is required for branded export')
  }

  // Create main canvas
  const mainCanvas = document.createElement('canvas')
  const ctx = mainCanvas.getContext('2d')!
  
  // Load clothing image
  const clothingImg = new window.Image()
  clothingImg.crossOrigin = 'anonymous'
  
  await new Promise((resolve, reject) => {
    clothingImg.onload = resolve
    clothingImg.onerror = reject
    clothingImg.src = clothingImageUrl
  })

  // Set canvas size based on image
  const targetWidth = 1080
  const targetHeight = Math.round((clothingImg.height / clothingImg.width) * targetWidth)
  mainCanvas.width = targetWidth
  mainCanvas.height = targetHeight

  // Draw clothing image
  ctx.drawImage(clothingImg, 0, 0, targetWidth, targetHeight)

  // Generate QR code
  const QRCode = (await import('qrcode')).default
  const qrCanvas = document.createElement('canvas')
  
  await QRCode.toCanvas(qrCanvas, qrCode, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H'
  })

  // Position for QR (bottom-right corner with padding)
  const qrPadding = 30
  const qrX = targetWidth - size - qrPadding
  const qrY = targetHeight - size - qrPadding

  // Draw white background for QR
  ctx.fillStyle = 'white'
  ctx.fillRect(qrX - 15, qrY - 15, size + 30, size + 30)
  
  // Draw black border
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 4
  ctx.strokeRect(qrX - 15, qrY - 15, size + 30, size + 30)

  // Draw QR code
  ctx.drawImage(qrCanvas, qrX, qrY)

  // Add text: "Quét để thử ngay với Clothify"
  ctx.fillStyle = 'black'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'right'
  ctx.fillText('Quét để thử ngay', targetWidth - qrPadding, qrY - 40)
  ctx.font = 'bold 28px Arial'
  ctx.fillStyle = '#F59E0B' // Amber color
  ctx.fillText('với Clothify', targetWidth - qrPadding, qrY - 10)

  // Download
  mainCanvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  })
}

/**
 * Export branded QR (Full: Professional layout with logo and branding)
 */
export async function exportBrandedFullQR(options: ExportOptions): Promise<void> {
  const { qrCode, clothingImageUrl, size = 300, fileName = 'clothify-qr-branded.png' } = options

  if (!clothingImageUrl) {
    throw new Error('Clothing image is required for branded export')
  }

  // Create main canvas (Instagram-friendly 1:1 ratio)
  const canvasSize = 1080
  const mainCanvas = document.createElement('canvas')
  mainCanvas.width = canvasSize
  mainCanvas.height = canvasSize
  const ctx = mainCanvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize)
  gradient.addColorStop(0, '#FEF3C7') // amber-100
  gradient.addColorStop(1, '#FDE68A') // yellow-200
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // Top section: Clothing image
  const clothingImg = new window.Image()
  clothingImg.crossOrigin = 'anonymous'
  
  await new Promise((resolve, reject) => {
    clothingImg.onload = resolve
    clothingImg.onerror = reject
    clothingImg.src = clothingImageUrl
  })

  // Draw clothing image (top 70%)
  const imgHeight = canvasSize * 0.6
  const imgWidth = canvasSize * 0.8
  const imgX = (canvasSize - imgWidth) / 2
  const imgY = 60

  // White background for image
  ctx.fillStyle = 'white'
  ctx.fillRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20)
  
  // Black border
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 6
  ctx.strokeRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20)

  // Draw image
  ctx.drawImage(clothingImg, imgX, imgY, imgWidth, imgHeight)

  // Bottom section: QR + Text
  const bottomY = imgY + imgHeight + 50

  // Title
  ctx.fillStyle = 'black'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('QUÉT ĐỂ THỬ NGAY!', canvasSize / 2, bottomY)

  // QR Code
  const QRCode = (await import('qrcode')).default
  const qrCanvas = document.createElement('canvas')
  
  await QRCode.toCanvas(qrCanvas, qrCode, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'H'
  })

  const qrX = (canvasSize - size) / 2
  const qrY = bottomY + 20

  // White background for QR
  ctx.fillStyle = 'white'
  ctx.fillRect(qrX - 15, qrY - 15, size + 30, size + 30)
  
  // Black border for QR
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 6
  ctx.strokeRect(qrX - 15, qrY - 15, size + 30, size + 30)

  // Draw QR
  ctx.drawImage(qrCanvas, qrX, qrY)

  // Clothify branding at bottom
  ctx.font = 'bold 36px Arial'
  ctx.fillStyle = '#F59E0B' // Amber
  ctx.fillText('Powered by Clothify', canvasSize / 2, qrY + size + 60)

  // Download
  mainCanvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  })
}

/**
 * Main export function - chooses format based on options
 */
export async function exportQRCode(options: ExportOptions): Promise<void> {
  switch (options.format) {
    case 'plain':
      return exportPlainQR(options)
    case 'branded-simple':
      return exportBrandedSimpleQR(options)
    case 'branded-full':
      return exportBrandedFullQR(options)
    default:
      return exportPlainQR(options)
  }
}

