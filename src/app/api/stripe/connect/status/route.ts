import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkStripeAccountStatus } from "@/modules/commerce/commerce.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artist = await prisma.artist.findUnique({
      where: { id: user.artistId },
      select: { stripeAccountId: true, stripeOnboarded: true },
    });

    if (!artist?.stripeAccountId) {
      return NextResponse.json({ connected: false });
    }

    const status = await checkStripeAccountStatus(artist.stripeAccountId);

    // Update onboarded status if charges are enabled
    if (status.chargesEnabled && !artist.stripeOnboarded) {
      await prisma.artist.update({
        where: { id: user.artistId },
        data: { stripeOnboarded: true },
      });
    }

    return NextResponse.json({
      connected: true,
      ...status,
    });
  } catch (error) {
    console.error("Stripe status error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
