import "dotenv/config";

const env = {
  port: process.env.PORT || 5000,

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,

  clientUrl: process.env.CLIENT_URL,

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,

  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  stripeDemoConnectedAccountId:
    process.env.STRIPE_DEMO_CONNECTED_ACCOUNT_ID,
};

export default env;