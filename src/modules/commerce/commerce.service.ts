import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { APP_URL, PLATFORM_FEE_PERCENT } from "@/lib/constants";

export async function createStripeConnectAccount(artistId: string) {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { user: { select: { email: true } } },
  });

  if (!artist) throw new Error("Artist not found");

  // Create or retrieve existing Stripe Connect account
  let accountId = artist.stripeAccountId;

  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: "express",
      email: artist.user.email,
      metadata: { artistId: artist.id },
    });
    accountId = account.id;

    await prisma.artist.update({
      where: { id: artistId },
      data: { stripeAccountId: accountId },
    });
  }

  // Create onboarding link
  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/dashboard/settings?stripe=refresh`,
    return_url: `${APP_URL}/dashboard/settings?stripe=success`,
    type: "account_onboarding",
  });

  return { url: accountLink.url, accountId };
}

export async function checkStripeAccountStatus(stripeAccountId: string) {
  const account = await getStripe().accounts.retrieve(stripeAccountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

export async function createCheckoutSession({
  productId,
  buyerUserId,
}: {
  productId: string;
  buyerUserId: string;
}) {
  const product = await prisma.digitalProduct.findUnique({
    where: { id: productId },
    include: { artist: { select: { id: true, stripeAccountId: true, name: true } } },
  });

  if (!product) throw new Error("Product not found");
  if (!product.isPublished) throw new Error("Product not available");
  if (!product.artist.stripeAccountId) {
    throw new Error("Artist has not connected Stripe");
  }

  const priceInCents = Math.round(Number(product.price) * 100);
  const platformFee = Math.round(priceInCents * (PLATFORM_FEE_PERCENT / 100));

  // Create a pending order
  const order = await prisma.order.create({
    data: {
      userId: buyerUserId,
      totalAmount: Number(product.price),
      items: {
        create: {
          productId: product.id,
          unitPrice: Number(product.price),
          productName: product.name,
          artistId: product.artist.id,
        },
      },
    },
  });

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: product.artist.stripeAccountId,
      },
    },
    success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/${product.artist.name}`,
    metadata: {
      orderId: order.id,
      productId: product.id,
      buyerUserId,
    },
  });

  // Save session ID on the order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return { sessionUrl: session.url, orderId: order.id };
}

export async function handleCheckoutCompleted(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId;

  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "COMPLETED",
      stripePaymentId: session.payment_intent as string,
    },
  });

  // Increment download counts for purchased products
  const items = await prisma.orderItem.findMany({
    where: { orderId },
  });

  for (const item of items) {
    await prisma.digitalProduct.update({
      where: { id: item.productId },
      data: { downloadCount: { increment: 1 } },
    });
  }
}

export async function handlePaymentFailed(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId;

  if (!orderId) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "FAILED" },
  });
}
