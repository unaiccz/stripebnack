// import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// )

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

/**
 * Send WhatsApp message with optional media
 * @param {string} to - Recipient phone number (format: whatsapp:+34XXXXXXXXX)
 * @param {string} message - Message text
 * @param {string} [mediaUrl] - Optional media URL
 * @returns {Promise<Object>} Twilio response
 */
export const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
  // Temporary mock implementation - replace with actual Twilio when credentials are confirmed
  console.log('WhatsApp message would be sent to:', to)
  console.log('Message:', message)
  if (mediaUrl) console.log('Media URL:', mediaUrl)
  
  // Simulate successful response
  return {
    sid: 'SM' + Math.random().toString(36).substr(2, 32),
    status: 'sent'
  }
}

/**
 * Send bulk WhatsApp messages
 * @param {Array} recipients - Array of {phone, name}
 * @param {string} messageTemplate - Message template with {{name}} placeholder
 * @param {string} [mediaUrl] - Optional media URL
 * @returns {Promise<Array>} Array of results
 */
export const sendBulkWhatsAppMessages = async (recipients, messageTemplate, mediaUrl = null) => {
  // Temporary mock implementation
  console.log('Bulk WhatsApp messages would be sent to:', recipients.length, 'recipients')
  console.log('Template:', messageTemplate)
  if (mediaUrl) console.log('Media URL:', mediaUrl)
  
  // Simulate results
  const results = recipients.map(recipient => ({
    phone: recipient.phone,
    name: recipient.name,
    status: 'success',
    sid: 'SM' + Math.random().toString(36).substr(2, 32)
  }))
  
  // Add small delay to simulate processing
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return results
}

/**
 * Validate phone number format for WhatsApp
 * @param {string} phoneNumber - Phone number
 * @returns {string} Formatted WhatsApp number
 */
export const formatWhatsAppNumber = (phoneNumber) => {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Spanish number if no country code
    if (cleaned.startsWith('34')) {
      cleaned = '+' + cleaned
    } else if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2)
    } else {
      // Assume Spanish number
      cleaned = '+34' + cleaned
    }
  }
  
  return `whatsapp:${cleaned}`
}