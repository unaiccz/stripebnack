# Configuración del Webhook de Stripe

Para que los pagos se confirmen automáticamente, necesitas configurar un webhook en Stripe.

## Pasos para Configurar el Webhook:

### 1. Acceder a Stripe Dashboard

Ve a: https://dashboard.stripe.com/test/webhooks

### 2. Crear Nuevo Endpoint

Haz clic en "Add endpoint" (Agregar endpoint)

### 3. Configurar el Endpoint

**URL del endpoint:**
```
http://localhost:4242/webhook
```

**Nota**: En producción, reemplaza `localhost` con tu dominio real.

**Eventos a escuchar:**
- Busca y selecciona: `checkout.session.completed`

### 4. Copiar el Webhook Secret

Después de crear el webhook, verás un **Signing secret** que empieza con `whsec_...`

Copia ese valor.

### 5. Agregar el Secret al archivo .env

Edita el archivo `backend/.env` y descomenta/actualiza esta línea:

```env
STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

### 6. Reiniciar el Backend

```bash
cd backend
npm start
```

## Probar el Webhook Localmente

### Opción 1: Usar Stripe CLI (Recomendado)

1. Instala Stripe CLI: https://stripe.com/docs/stripe-cli
2. Inicia sesión:
   ```bash
   stripe login
   ```
3. Redirige webhooks al backend local:
   ```bash
   stripe listen --forward-to localhost:4242/webhook
   ```
4. Stripe CLI te dará un webhook secret temporal, úsalo en tu `.env`

### Opción 2: Usar ngrok

1. Instala ngrok: https://ngrok.com/
2. Expón tu puerto local:
   ```bash
   ngrok http 4242
   ```
3. Usa la URL de ngrok en Stripe Dashboard
4. Ejemplo: `https://abc123.ngrok.io/webhook`

## Verificar que Funciona

1. Inicia el backend:
   ```bash
   cd backend
   npm start
   ```

2. Realiza una inscripción de prueba en un evento de pago

3. Completa el pago en Stripe Checkout

4. Verifica en la consola del backend que el webhook se recibió:
   ```
   Inscripción marcada como pagada: 123
   ```

5. Verifica en Supabase que `pagado: true` en la tabla `socio_evento`

## Solución de Problemas

### El webhook no se recibe

- Verifica que el backend está corriendo en el puerto 4242
- Verifica que la URL del webhook es correcta
- Verifica que seleccionaste el evento `checkout.session.completed`

### Error de firma del webhook

- Verifica que el `STRIPE_WEBHOOK_SECRET` es correcto
- Asegúrate de reiniciar el backend después de cambiar el `.env`

### La inscripción no se marca como pagada

- Verifica en Stripe Dashboard > Webhooks que el evento se envió correctamente
- Verifica los logs del backend para ver errores
- Verifica que la columna `stripe_session_id` existe en `socio_evento`

## Recursos

- Documentación Stripe Webhooks: https://stripe.com/docs/webhooks
- Testing Webhooks: https://stripe.com/docs/webhooks/test
- Stripe CLI: https://stripe.com/docs/stripe-cli
