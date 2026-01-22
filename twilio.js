import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

/**
 * Send WhatsApp message with optional media
 * @param {string} to - Recipient phone number (format: whatsapp:+34XXXXXXXXX)
 * @param {string} message - Message text
 * @param {string} [mediaUrl] - Optional media URL
 * @returns {Promise<Object>} Twilio response
 */
export const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
  try {
    const messageData = {
      from: TWILIO_WHATSAPP_NUMBER,
      to: to,
      body: message
    };
    
    if (mediaUrl) {
      messageData.mediaUrl = [mediaUrl];
    }
    
    const response = await client.messages.create(messageData);
    return response;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
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
  try {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const personalizedMessage = messageTemplate.replace('{{name}}', recipient.name);
        const response = await sendWhatsAppMessage(recipient.phone, personalizedMessage, mediaUrl);
        
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'success',
          sid: response.sid
        });
      } catch (error) {
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'failed',
          error: error.message
        });
      }
      
      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  } catch (error) {
    console.error('Error sending bulk WhatsApp messages:', error);
    throw error;
  }
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