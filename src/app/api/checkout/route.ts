import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckoutSession } from "@/modules/commerce/commerce.service";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const { sessionUrl } = await createCheckoutSession({
      productId,
      buyerUserId: user.id,
    });

    return NextResponse.json({ url: sessionUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    console.error("Checkout error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
