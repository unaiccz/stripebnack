import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const VONAGE_API_KEY = process.env.VONAGE_API_KEY || '6c4aa897';
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET || 'PsSjp3KtvhTNZo4w';
const VONAGE_FROM = process.env.VONAGE_FROM || 'CasinoTauste';

// Endpoint para envío masivo de SMS
router.post('/send-bulk', async (req, res) => {
  const { recipients, messageTemplate } = req.body;
  if (!Array.isArray(recipients) || !messageTemplate) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }
  const results = [];
  for (const recipient of recipients) {
    const personalizedMessage = messageTemplate.replace('{{name}}', recipient.name);
    try {
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          api_key: VONAGE_API_KEY,
          api_secret: VONAGE_API_SECRET,
          to: recipient.phone,
          from: VONAGE_FROM,
          text: personalizedMessage
        })
      });
      const data = await response.json();
      if (data.messages && data.messages[0].status === '0') {
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'success',
          messageId: data.messages[0]['message-id']
        });
      } else {
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: 'failed',
          error: data.messages[0]['error-text'] || 'Error enviando SMS'
        });
      }
    } catch (error) {
      results.push({
        phone: recipient.phone,
        name: recipient.name,
        status: 'failed',
        error: error.message
      });
    }
    // Pequeña pausa para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  res.json({
    success: true,
    total: results.length,
    sent: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    results
  });
});
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const VONAGE_API_KEY = process.env.VONAGE_API_KEY || '6c4aa897';
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET || 'PsSjp3KtvhTNZo4w';
const VONAGE_FROM = process.env.VONAGE_FROM || 'CasinoTauste';

// Endpoint para enviar SMS individual
router.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }
  try {
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        api_key: VONAGE_API_KEY,
        api_secret: VONAGE_API_SECRET,
        to,
        from: VONAGE_FROM,
        text: message
      })
    });
    const data = await response.json();
    if (data.messages && data.messages[0].status === '0') {
      res.json({ success: true, messageId: data.messages[0]['message-id'] });
    } else {
      res.status(500).json({ error: data.messages[0]['error-text'] || 'Error enviando SMS' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
