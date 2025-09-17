import { PayOS } from '@payos/node'
import crypto from 'crypto'

// PayOS Configuration
export const PAYOS_CONFIG = {
  // PayOS credentials từ environment variables
  CLIENT_ID: process.env.PAYOS_CLIENT_ID!,
  API_KEY: process.env.PAYOS_API_KEY!,
  CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY!,
  
  // Return URLs
  RETURN_URL: 'http://localhost:3000/api/payment/payos/return',
  CANCEL_URL: 'http://localhost:3000/membership',
  
  // Payment settings
  CURRENCY: 'VND',
  DESCRIPTION: 'Thanh toán gói membership Clothify'
}

// Khởi tạo PayOS client theo documentation chính thức
export const payos = new PayOS({
  clientId: PAYOS_CONFIG.CLIENT_ID,
  apiKey: PAYOS_CONFIG.API_KEY,
  checksumKey: PAYOS_CONFIG.CHECKSUM_KEY,
  baseURL: 'https://api-merchant.payos.vn',
  timeout: 30000,
  maxRetries: 3,
  logLevel: 'info'
})

export interface PayOSPaymentRequest {
  orderCode: number
  amount: number
  description: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  returnUrl: string
  cancelUrl: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  expiredAt?: number
}

export interface PayOSPaymentResponse {
  code: string
  desc: string
  data: {
    bin: string
    accountNumber: string
    accountName: string
    amount: number
    description: string
    orderCode: number
    currency: string
    paymentLinkId: string
    status: string
    checkoutUrl: string
    qrCode: string
  }
}

export interface PayOSPaymentInfo {
  code: string
  desc: string
  data: {
    orderCode: number
    amount: number
    description: string
    accountNumber: string
    reference: string
    transactionDateTime: string
    currency: string
    paymentLinkId: string
    code: string
    desc: string
    counterAccountBankId: string
    counterAccountBankName: string
    counterAccountName: string
    counterAccountNumber: string
    virtualAccountName: string
    virtualAccountNumber: string
  }
}

/**
 * Tạo chữ ký PayOS
 */
export function createPayOSSignature(data: string): string {
  return crypto
    .createHmac('sha256', PAYOS_CONFIG.CHECKSUM_KEY)
    .update(data)
    .digest('hex')
}

/**
 * Tạo payment request với PayOS SDK chính thức theo documentation
 */
export async function createPayOSPayment(params: {
  amount: number
  orderInfo: string
  orderId: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
}): Promise<any> {
  const { amount, orderInfo, orderId, buyerName, buyerEmail, buyerPhone } = params
  
  // Tạo order code (timestamp + random) - phải là số nguyên
  const orderCode = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000)
  
  // Debug credentials
  console.log('=== PayOS Debug Info ===')
  console.log('- Client ID:', PAYOS_CONFIG.CLIENT_ID ? 'EXISTS' : 'MISSING')
  console.log('- API Key:', PAYOS_CONFIG.API_KEY ? 'EXISTS' : 'MISSING')
  console.log('- Checksum Key:', PAYOS_CONFIG.CHECKSUM_KEY ? 'EXISTS' : 'MISSING')
  console.log('- Order Code:', orderCode)
  console.log('- Amount:', amount)
  console.log('- Order Info:', orderInfo)
  
  try {
    // Sử dụng PayOS SDK theo documentation chính thức
    const paymentLink = await payos.paymentRequests.create({
      orderCode: orderCode,
      amount: amount,
      description: orderInfo,
      items: [
        {
          name: orderInfo,
          quantity: 1,
          price: amount
        }
      ],
      returnUrl: PAYOS_CONFIG.RETURN_URL,
      cancelUrl: PAYOS_CONFIG.CANCEL_URL,
      // buyerName, // PayOS có thể không hỗ trợ
      // buyerEmail, // PayOS có thể không hỗ trợ  
      // buyerPhone, // PayOS có thể không hỗ trợ
      expiredAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    })
    
    console.log('=== PayOS Payment Created (SDK) ===')
    console.log('- Order Code:', orderCode)
    console.log('- Amount:', amount)
    console.log('- Payment URL:', paymentLink.checkoutUrl)
    console.log('- QR Code:', paymentLink.qrCode)
    
    return paymentLink
  } catch (error) {
    console.error('Error creating PayOS payment:', error)
    console.error('Error details:', error)
    throw error
  }
}

/**
 * Lấy thông tin payment từ PayOS SDK
 */
export async function getPayOSPaymentInfo(orderCode: number): Promise<any> {
  try {
    const paymentInfo = await payos.paymentRequests.get(orderCode)
    
    console.log('=== PayOS Payment Info ===')
    console.log('- Order Code:', orderCode)
    console.log('- Status:', paymentInfo.status)
    console.log('- Amount:', paymentInfo.amount)
    
    return paymentInfo
  } catch (error) {
    console.error('Error getting PayOS payment info:', error)
    throw error
  }
}

/**
 * Xác thực webhook từ PayOS
 */
export function verifyPayOSWebhook(data: string, signature: string): boolean {
  const expectedSignature = createPayOSSignature(data)
  return signature === expectedSignature
}

/**
 * Lấy IP address của client
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return '127.0.0.1'
}
