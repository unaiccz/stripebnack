// backend/stripe.js

import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import { sendWhatsAppMessage, sendBulkWhatsAppMessages, formatWhatsAppNumber } from './twilio.js';
import { createClient } from '@supabase/supabase-js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase client for fetching socio data (temporarily disabled)
// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

app.use(cors());
app.use(express.json());

// Endpoint para crear sesión de pago de INSCRIPCIONES (NO CUOTAS)
app.post('/create-checkout-session', express.json(), async (req, res) => {
  const { evento, socio } = req.body;
  
  try {
    // Generar un ID temporal para la inscripción
    const tempInscripcionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: evento.nombre_evento,
              description: `Inscripción a evento - ${new Date(evento.fecha_evento).toLocaleDateString('es-ES')}`,
            },
            unit_amount: Math.round(evento.coste * 100), // Convertir a céntimos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}&evento_id=${evento.id_evento}&socio_id=${socio.id_socio}&temp_id=${tempInscripcionId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/eventos/${evento.id_evento}?payment_cancelled=true&evento_id=${evento.id_evento}`,
      client_reference_id: tempInscripcionId,
      customer_email: socio.email,
      metadata: {
        type: 'inscripcion',
        id_socio: socio.id_socio,
        id_evento: evento.id_evento,
        temp_id: tempInscripcionId
      }
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook para recibir eventos de Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Procesar pago completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Verificar que es una inscripción (NO cuota)
    if (session.metadata?.type === 'inscripcion') {
      const idSocioEvento = session.metadata.id_socio_evento;
      
      if (idSocioEvento) {
        // Log para debugging - el frontend se encargará de actualizar el estado
        console.log('✅ Pago completado para inscripción:', idSocioEvento);
        console.log('Session ID:', session.id);
        
        // En entornos de desarrollo, podrías hacer una llamada al frontend
        // Pero en producción, es mejor que el frontend consulte el estado
      }
    }
  }

  res.json({ received: true });
});

// WhatsApp Endpoints (temporarily disabled until Supabase configured)

// // Get socios with WhatsApp numbers
// app.get('/api/whatsapp/socios', async (req, res) => {
//   try {
//     const { filtro } = req.query;
//     
//     let query = supabase
//       .from('socios')
//       .select('id_socio, nombre, apellido1, apellido2, telefono, estado')
//       .neq('telefono', null)
//       .neq('telefono', '');
//
//     if (filtro === 'activos') {
//       query = query.eq('estado', 'Activo');
//     }
//
//     const { data, error } = await query.order('nombre');
//
//     if (error) throw error;
//
//     const formattedSocios = data.map(socio => ({
//       id_socio: socio.id_socio,
//       nombre: `${socio.nombre} ${socio.apellido1} ${socio.apellido2 || ''}`,
//       telefono: socio.telefono,
//       estado: socio.estado,
//       whatsapp_number: formatWhatsAppNumber(socio.telefono)
//     }));
//
//     res.json(formattedSocios);
//   } catch (error) {
//     console.error('Error fetching socios:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Send individual WhatsApp message
// app.post('/api/whatsapp/send', async (req, res) => {
//   try {
//     const { to, message, mediaUrl } = req.body;
//
//     if (!to || !message) {
//       return res.status(400).json({ error: 'Phone number and message are required' });
//     }
//
//     const formattedNumber = formatWhatsAppNumber(to);
//     const response = await sendWhatsAppMessage(formattedNumber, message, mediaUrl);
//
//     res.json({
//       success: true,
//       sid: response.sid,
//       status: response.status
//     });
//   } catch (error) {
//     console.error('Error sending WhatsApp message:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
//
// // Send bulk WhatsApp messages
// app.post('/api/whatsapp/bulk-send', async (req, res) => {
//   try {
//     const { recipients, messageTemplate, mediaUrl } = req.body;
//
//     if (!recipients || !messageTemplate) {
//       return res.status(400).json({ error: 'Recipients and message template are required' });
//     }
//
//     // Format phone numbers
//     const formattedRecipients = recipients.map(recipient => ({
//       ...recipient,
//       phone: formatWhatsAppNumber(recipient.telefono)
//     }));
//
//     const results = await sendBulkWhatsAppMessages(formattedRecipients, messageTemplate, mediaUrl);
//
//     res.json({
//       success: true,
//       total: results.length,
//       sent: results.filter(r => r.status === 'success').length,
//       failed: results.filter(r => r.status === 'failed').length,
//       results
//     });
//   } catch (error) {
//     console.error('Error sending bulk WhatsApp messages:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

const PORT = process.env.STRIPE_PORT || 4242;
app.listen(PORT, () => console.log(`✅ Stripe backend listening on port ${PORT}`));
