import { CheckoutInvoice, Setup, Store } from "paydunya";
import { env } from "../../config/env.js";
import { getMongoDatabase } from "../../mongodb/client.js";
import { HttpError } from "../../http/errors.js";

const paidPlans = ["essential", "premium"] as const;
type PaidPlan = (typeof paidPlans)[number];
type PaymentDocument = {
  userId: string;
  email: string | null;
  plan: string;
  amount: number;
  token: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
type SubscriptionDocument = PaymentDocument & {
  canceledAt?: Date | null;
  startedAt?: Date;
  paymentToken?: string;
};
const plans = {
  discover: { label: "Découverte", price: 0 },
  essential: { label: "Essentiel", price: 5_000 },
  premium: { label: "Premium", price: 10_000 },
  sponsor: { label: "Sponsor Officiel", price: Infinity },
} as const;

function getPlan(plan: string) {
  if (!(plan in plans)) throw new HttpError(400, "INVALID_PLAN", "Unknown pricing plan");
  return plans[plan as keyof typeof plans];
}

function getPayDunya() {
  if (!env.PAYDUNYA_MASTER_KEY || !env.PAYDUNYA_PRIVATE_KEY || !env.PAYDUNYA_TOKEN) {
    throw new HttpError(503, "PAYMENT_NOT_CONFIGURED", "PayDunya is not configured");
  }
  const setup = new Setup({ masterKey: env.PAYDUNYA_MASTER_KEY, privateKey: env.PAYDUNYA_PRIVATE_KEY, publicKey: env.PAYDUNYA_PUBLIC_KEY, token: env.PAYDUNYA_TOKEN, mode: env.PAYDUNYA_MODE });
  const store = new Store({ name: env.PAYDUNYA_STORE_NAME, returnURL: `${env.APP_BASE_URL}/pricing?payment=success`, cancelURL: `${env.APP_BASE_URL}/pricing?payment=cancelled`, callbackURL: `${env.APP_BASE_URL}/api/v2/payments/callback` });
  return { setup, store };
}

export async function createCheckout(user: { uid: string; email?: string | null }, plan: string) {
  if (!paidPlans.includes(plan as PaidPlan)) throw new HttpError(400, "INVALID_PLAN", "Only paid plans can be purchased");
  const planInfo = getPlan(plan);
  const { setup, store } = getPayDunya();
  const invoice = new CheckoutInvoice(setup, store);
  invoice.totalAmount = planInfo.price;
  invoice.description = `${planInfo.label} plan`;
  invoice.addItem(planInfo.label, 1, planInfo.price, planInfo.price);
  invoice.addCustomData("userId", user.uid);
  invoice.addCustomData("plan", plan);
  await invoice.create();
  if (!invoice.token || !invoice.url) throw new HttpError(502, "PAYMENT_CHECKOUT_FAILED", "PayDunya did not return a checkout URL");
  const database = await getMongoDatabase();
  await database.collection<PaymentDocument>("payments").insertOne({ userId: user.uid, email: user.email ?? null, plan, amount: planInfo.price, token: invoice.token, status: "pending", createdAt: new Date(), updatedAt: new Date() });
  return { checkoutUrl: invoice.url, token: invoice.token, plan };
}

export async function confirmCheckout(token: string, expectedUserId?: string) {
  const database = await getMongoDatabase();
  const payment = await database.collection<PaymentDocument>("payments").findOne({ token });
  if (!payment) throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  if (expectedUserId && payment.userId !== expectedUserId) throw new HttpError(403, "PAYMENT_FORBIDDEN", "Payment does not belong to this user");
  const { setup, store } = getPayDunya();
  const invoice = new CheckoutInvoice(setup, store);
  await invoice.confirm(token);
  const status = invoice.status === "completed" ? "completed" : invoice.status ?? "failed";
  await database.collection("payments").updateOne({ token }, { $set: { status, updatedAt: new Date() } });
  if (status === "completed") await database.collection("subscriptions").updateOne({ userId: payment.userId }, { $set: { userId: payment.userId, email: payment.email ?? null, plan: payment.plan, status: "active", paymentToken: token, amount: payment.amount, startedAt: new Date(), canceledAt: null, updatedAt: new Date() } }, { upsert: true });
  return { status, plan: payment.plan };
}

export async function getSubscription(userId: string) {
  const database = await getMongoDatabase();
  return (await database.collection<SubscriptionDocument>("subscriptions").findOne({ userId })) ?? { userId, plan: "discover", status: "active" };
}

export async function cancelSubscription(userId: string) {
  const database = await getMongoDatabase();
  await database.collection("subscriptions").updateOne({ userId }, { $set: { plan: "discover", status: "canceled", canceledAt: new Date(), updatedAt: new Date() } });
  return getSubscription(userId);
}

export async function listSubscriptions() {
  const database = await getMongoDatabase();
  return database.collection<SubscriptionDocument>("subscriptions").find({}).sort({ updatedAt: -1 }).toArray();
}

export async function updateSubscription(userId: string, plan: string, status: "active" | "canceled") {
  getPlan(plan);
  const database = await getMongoDatabase();
  await database.collection("subscriptions").updateOne({ userId }, { $set: { plan, status, updatedAt: new Date(), ...(status === "canceled" ? { canceledAt: new Date() } : { canceledAt: null }) } }, { upsert: true });
  return getSubscription(userId);
}