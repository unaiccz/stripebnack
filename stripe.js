// backend/stripe.js

import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());

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
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}&evento_id=${evento.id_evento}&socio_id=${socio.id_socio}&temp_id=${tempInscripcionId}`,
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

const PORT = process.env.STRIPE_PORT || 4242;
app.listen(PORT, () => console.log(`✅ Stripe backend listening on port ${PORT}`));
