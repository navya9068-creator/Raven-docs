import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key.startsWith('MY_')) {
    return null;
  }
  return new Stripe(key);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'dark-academia', timestamp: new Date().toISOString() });
  });

  app.get('/api/billing/config', (_req: Request, res: Response) => {
    const stripe = getStripeClient();
    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY?.trim() || '';
    const annualPriceId = process.env.STRIPE_PRICE_ANNUAL?.trim() || '';
    const stripeConfigured = Boolean(stripe && monthlyPriceId && annualPriceId);

    res.json({
      stripeConfigured,
      trialDays: 7,
      plans: {
        monthly: {
          id: 'monthly',
          label: 'Monthly Scholar',
          priceDisplay: '$6.99',
          interval: 'month',
          configured: Boolean(stripe && monthlyPriceId),
        },
        annual: {
          id: 'annual',
          label: 'Annual Fellow',
          priceDisplay: '$49.99',
          interval: 'year',
          savingsNote: 'Save 40% · $4.17/mo equivalent',
          configured: Boolean(stripe && annualPriceId),
        },
      },
      nativeStoreProducts: {
        androidPackageId: 'com.darkacademia.study',
        iosBundleId: 'com.darkacademia.study',
        monthlyProductId: 'dark_academia_premium_monthly',
        annualProductId: 'dark_academia_premium_annual',
      },
      requiredConfiguration: stripeConfigured
        ? []
        : [
            'STRIPE_SECRET_KEY (Web/PWA checkout)',
            'STRIPE_PRICE_MONTHLY (Stripe Monthly Price ID)',
            'STRIPE_PRICE_ANNUAL (Stripe Annual Price ID)',
            'Google Play Console Billing Product IDs (Android AAB)',
            'App Store Connect StoreKit 2 Product IDs (iOS IPA)',
          ],
    });
  });

  app.post('/api/billing/create-checkout-session', async (req: Request, res: Response) => {
    const stripe = getStripeClient();
    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY?.trim();
    const annualPriceId = process.env.STRIPE_PRICE_ANNUAL?.trim();

    if (!stripe || !monthlyPriceId || !annualPriceId) {
      res.status(503).json({
        error: 'Billing gateway is not configured on this server.',
        missingConfig: ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_ANNUAL'],
      });
      return;
    }

    const body = req.body as { plan?: string; email?: string; uid?: string };
    const selectedPlan = body.plan === 'annual' ? 'annual' : 'monthly';
    const priceId = selectedPlan === 'annual' ? annualPriceId : monthlyPriceId;
    const appUrl = process.env.APP_URL?.trim() || `http://localhost:${PORT}`;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: typeof body.email === 'string' && body.email.includes('@') ? body.email : undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            uid: typeof body.uid === 'string' ? body.uid : '',
            plan: selectedPlan,
          },
        },
        success_url: `${appUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/?billing=canceled`,
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create checkout session';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/billing/restore', async (req: Request, res: Response) => {
    const stripe = getStripeClient();
    if (!stripe) {
      res.status(503).json({
        restored: false,
        error: 'Store receipt verification requires STRIPE_SECRET_KEY on Web or Play Billing / StoreKit 2 on native builds.',
      });
      return;
    }

    const body = req.body as { email?: string };
    if (!body.email || typeof body.email !== 'string') {
      res.status(400).json({ restored: false, error: 'Account email is required to verify purchases.' });
      return;
    }

    try {
      const customers = await stripe.customers.list({ email: body.email, limit: 3 });
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 5 });
        const active = subs.data.find((s) => s.status === 'active' || s.status === 'trialing');
        if (active) {
          res.json({
            restored: true,
            status: active.status,
            subscriptionId: active.id,
          });
          return;
        }
      }
      res.json({ restored: false, message: 'No active or trialing subscription found for this account.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Restore verification failed';
      res.status(500).json({ restored: false, error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DARK ACADEMIA server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
