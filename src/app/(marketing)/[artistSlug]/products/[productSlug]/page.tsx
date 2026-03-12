import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BuyButton } from "./BuyButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ artistSlug: string; productSlug: string }>;
}) {
  const { artistSlug, productSlug } = await params;

  const artist = await prisma.artist.findUnique({
    where: { slug: artistSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      stripeAccountId: true,
      stripeOnboarded: true,
    },
  });

  if (!artist) notFound();

  const product = await prisma.digitalProduct.findFirst({
    where: {
      artistId: artist.id,
      slug: productSlug,
      isPublished: true,
    },
  });

  if (!product) notFound();

  const canPurchase = !!artist.stripeAccountId && artist.stripeOnboarded;

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Link
          href={`/${artistSlug}`}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {artist.name}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-xl"
              />
            ) : (
              <div className="w-full aspect-square bg-neutral-800 rounded-xl flex items-center justify-center">
                <Package className="h-16 w-16 text-neutral-600" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Badge variant="default" className="mb-3">
              {product.productType.replace("_", " ")}
            </Badge>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-sm text-neutral-400 mb-1">by {artist.name}</p>

            <div className="flex items-baseline gap-3 mt-4 mb-6">
              <span className="text-3xl font-bold text-amber-400">
                {formatCurrency(Number(product.price))}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-neutral-600 line-through">
                  {formatCurrency(Number(product.compareAtPrice))}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-neutral-400 mb-6 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {canPurchase ? (
              <BuyButton productId={product.id} />
            ) : (
              <Card>
                <CardContent>
                  <p className="text-sm text-neutral-500">
                    This artist hasn&apos;t set up payments yet. Check back
                    soon!
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="mt-6 text-xs text-neutral-600">
              {product.downloadCount > 0 && (
                <p>{product.downloadCount} downloads</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
