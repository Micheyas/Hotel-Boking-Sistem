const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, roomType, customerEmail } = req.body;
    if (!amount || !roomType || !customerEmail) {
      return res.status(400).json({ error: 'amount, roomType, and customerEmail are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Room booking: ${roomType}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};