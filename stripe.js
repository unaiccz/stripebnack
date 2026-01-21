// backend/stripe.js

import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import supabase from './supabaseClient.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());

// Endpoint para crear sesión de pago de INSCRIPCIONES (NO CUOTAS)
app.post('/create-checkout-session', express.json(), async (req, res) => {
  const { inscripcion, socio } = req.body;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: inscripcion.evento.nombre_evento,
              description: `Inscripción a evento - ${new Date(inscripcion.evento.fecha_evento).toLocaleDateString('es-ES')}`,
            },
            unit_amount: Math.round(inscripcion.evento.coste * 100), // Convertir a céntimos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}&inscripcion_id=${inscripcion.id_socio_evento}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/eventos/${inscripcion.id_evento}?payment_cancelled=true&inscripcion_id=${inscripcion.id_socio_evento}`,
      client_reference_id: inscripcion.id_socio_evento.toString(),
      customer_email: socio.email,
      metadata: {
        type: 'inscripcion',
        id_socio_evento: inscripcion.id_socio_evento,
        id_socio: inscripcion.id_socio,
        id_evento: inscripcion.id_evento
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
        const { error } = await supabase
          .from('socio_evento')
          .update({ 
            pagado: true, 
            fecha_pago: new Date().toISOString(),
            stripe_session_id: session.id
          })
          .eq('id_socio_evento', idSocioEvento);
          
        if (error) {
          console.error('Error actualizando inscripción en Supabase:', error.message);
        } else {
          console.log('Inscripción marcada como pagada:', idSocioEvento);
        }
      }
    }
  }

  res.json({ received: true });
});

const PORT = process.env.STRIPE_PORT || 4242;
app.listen(PORT, () => console.log(`Stripe backend listening on port ${PORT}`));
