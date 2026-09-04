const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const { success, badRequest } = require('../utils/apiResponse');

// Lazy-initialize Stripe client so missing env var does not crash server at startup
let _stripeInstance = null;
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('STRIPE_SECRET_KEY is not configured on this server');
    error.statusCode = 503;
    throw error;
  }
  if (!_stripeInstance) {
    _stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return _stripeInstance;
};

// Plan price IDs — create these in your Stripe dashboard
const PRICE_IDS = {
  premium:  process.env.STRIPE_PRICE_PREMIUM,   // 9 TND/month - job seeker
  pro:      process.env.STRIPE_PRICE_PRO,        // 29 TND/month - recruiter
  business: process.env.STRIPE_PRICE_BUSINESS,   // 79 TND/month - recruiter
};

// ── Create Stripe checkout session ────────────────────────────────────────────
router.post('/create-checkout-session', protect, async (req, res, next) => {
  try {
    const { plan } = req.body;
    const priceId  = PRICE_IDS[plan];
    if (!priceId) return badRequest(res, 'Invalid plan selected');

    const user = await User.findById(req.user.id);

    // Create or reuse Stripe customer
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name:  user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, {
        'subscription.stripeCustomerId': customerId,
      });
    }

    const session = await getStripe().checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/payment/cancelled`,
      metadata:    { userId: user._id.toString(), plan },
    });

    success(res, { url: session.url }, 'Checkout session created');
  } catch (e) { next(e); }
});

// ── Cancel subscription ───────────────────────────────────────────────────────
router.post('/cancel-subscription', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const subId = user.subscription?.stripeSubscriptionId;
    if (!subId) return badRequest(res, 'No active subscription');

    await getStripe().subscriptions.update(subId, { cancel_at_period_end: true });
    success(res, {}, 'Subscription will cancel at end of billing period');
  } catch (e) { next(e); }
});

// ── Stripe webhook (raw body required — configured in server.js) ───────────────
router.post('/stripe', async (req, res) => {
  const sig     = req.headers['stripe-signature'];
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Stripe webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    await User.findByIdAndUpdate(userId, {
      'subscription.plan':                 plan,
      'subscription.stripeSubscriptionId': session.subscription,
      'subscription.expiresAt':            null, // managed by Stripe
    });
    console.log(`✅ Subscription activated: ${plan} for user ${userId}`);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub    = event.data.object;
    const user   = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
    if (user) {
      await User.findByIdAndUpdate(user._id, { 'subscription.plan': 'free', 'subscription.stripeSubscriptionId': null });
      console.log(`ℹ️  Subscription cancelled for user ${user._id}`);
    }
  }

  res.json({ received: true });
});

module.exports = router;
