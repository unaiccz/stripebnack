import twilio from 'twilio'
import dotenv from 'dotenv'

dotenv.config()

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER // For SMS

/**
 * Format number for Twilio (SMS or WhatsApp)
 * @param {string} phoneNumber 
 * @param {boolean} isWhatsApp 
 * @returns {string}
 */
export const formatPhoneNumber = (phoneNumber, isWhatsApp = false) => {
  let cleaned = phoneNumber.replace(/[^\d+]/g, '')

  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('34')) {
      cleaned = '+' + cleaned
    } else if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2)
    } else {
      cleaned = '+34' + cleaned
    }
  }

  return isWhatsApp ? `whatsapp:${cleaned}` : cleaned
}

/**
 * Send individual SMS
 */
export const sendSMS = async (to, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formatPhoneNumber(to, false)
    });
    return response;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Send bulk SMS
 */
export const sendBulkSMS = async (recipients, messageTemplate) => {
  const results = [];
  for (const recipient of recipients) {
    try {
      const personalizedMessage = messageTemplate.replace('{{name}}', recipient.name);
      const response = await sendSMS(recipient.telefono || recipient.phone, personalizedMessage);
      results.push({ phone: recipient.telefono || recipient.phone, name: recipient.name, status: 'success', sid: response.sid });
    } catch (error) {
      results.push({ phone: recipient.telefono || recipient.phone, name: recipient.name, status: 'failed', error: error.message });
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}

/**
 * Send WhatsApp message with optional media
 */
export const sendWhatsAppMessage = async (to, message, mediaUrl = null) => {
  try {
    const messageData = {
      from: TWILIO_WHATSAPP_NUMBER,
      to: formatPhoneNumber(to, true),
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
 */
export const sendBulkWhatsAppMessages = async (recipients, messageTemplate, mediaUrl = null) => {
  const results = [];
  for (const recipient of recipients) {
    try {
      const personalizedMessage = messageTemplate.replace('{{name}}', recipient.name);
      const response = await sendWhatsAppMessage(recipient.telefono || recipient.phone, personalizedMessage, mediaUrl);
      results.push({ phone: recipient.telefono || recipient.phone, name: recipient.name, status: 'success', sid: response.sid });
    } catch (error) {
      results.push({ phone: recipient.telefono || recipient.phone, name: recipient.name, status: 'failed', error: error.message });
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return results;
}
