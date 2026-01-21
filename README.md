# Backend - Stripe Payment Gateway

This backend handles Stripe payment processing for **event inscriptions ONLY**.

**IMPORTANT:** Monthly membership fees (cuotas mensuales) are NOT processed through Stripe. They are automatically charged via SEPA direct debit from the family group's IBAN.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install express stripe cors dotenv
```

### 2. Create `.env` File

Create a `backend/.env` file with your Stripe credentials:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PORT=4242
FRONTEND_URL=http://localhost:5173
```

### 3. Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/
2. Get your **Secret Key** (starts with `sk_test_` for test mode)
3. Set up a webhook endpoint to receive payment confirmations:
   - Go to Developers > Webhooks
   - Add endpoint: `http://localhost:4242/webhook`
   - Select event: `checkout.session.completed`
   - Copy the **Webhook Signing Secret** (starts with `whsec_`)

### 4. Start the Backend

```bash
node stripe.js
```

The backend will run on http://localhost:4242

## Payment Flow for Event Inscriptions

### User Journey:

1. **Member** clicks "Inscribirme Ahora" (Sign me up) on an event
2. **System** creates a temporary inscription in the database
3. **System** redirects member to Stripe's secure payment page
4. **Member** completes payment with their credit card
5. **Stripe** redirects to:
   - **Success page** (`/success`) if payment succeeds
   - **Event page** (`/eventos/:id`) with cancellation notice if payment is cancelled
6. **Webhook** receives payment confirmation from Stripe
7. **System** marks the inscription as paid (`pagado: true`)

### Payment Cancellation:

If the user cancels during payment:
1. They are redirected back to the event page
2. The temporary inscription is automatically deleted
3. They can try again without duplicate inscriptions

### Free Events:

For events with `coste = 0` (free):
- No payment is required
- Inscription is created immediately
- No Stripe redirect occurs

## Important Notes

- **Event inscriptions** = paid with Stripe (card payments)
- **Monthly fees (cuotas)** = paid with SEPA direct debit (NOT Stripe)
- All payments are in EUR (Euros)
- Test mode uses `sk_test_` keys (no real charges)
- Production mode uses `sk_live_` keys (real charges)
- Inscriptions are created BEFORE payment to generate the session
- If payment fails or is cancelled, the inscription is deleted

## Security

- Never commit your `.env` file
- Keep your Secret Key and Webhook Secret private
- Use test keys during development
- Verify webhook signatures to prevent fraud
