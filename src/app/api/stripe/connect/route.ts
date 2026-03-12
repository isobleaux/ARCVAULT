import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createStripeConnectAccount } from "@/modules/commerce/commerce.service";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.artistId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await createStripeConnectAccount(user.artistId);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe account" },
      { status: 500 }
    );
  }
}
