## URLs de éxito y cancelación

En el backend, las URLs de éxito y cancelación están configuradas así:

- success_url: http://localhost:3000/success
- cancel_url: http://localhost:3000/cancel

Si despliegas el frontend en producción, cambia estas URLs en `stripe.js` para que apunten a tu dominio real.
# Stripe Backend para Render

Este backend expone un endpoint para crear sesiones de pago de Stripe.

## Despliegue en Render

1. **Repositorio**: Sube solo la carpeta `backend` a tu repositorio (o usa la raíz si solo tienes el backend).
2. **En Render**:
	 - Crea un nuevo Web Service.
	 - Selecciona tu repo y rama.
	 - **Root Directory**: `backend`
	 - **Build Command**: `npm install`
	 - **Start Command**: `node stripe.js`
	 - **Environment**: Node
	 - Añade la variable de entorno:
		 - KEY: `STRIPE_SECRET_KEY`
		 - VALUE: tu clave secreta de Stripe

## Código para usar variable de entorno

En `stripe.js`, la clave secreta se toma de la variable de entorno:

```js
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

Así nunca expones tu clave en el código.

---

Cuando Render termine, tendrás una URL pública para tu backend. Úsala en tu frontend para crear sesiones de pago.
