"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  productType: string;
  isPublished: boolean;
  downloadCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  BEAT: "Beat",
  SAMPLE_PACK: "Sample Pack",
  PRESET: "Preset",
  STEM: "Stem",
  SHEET_MUSIC: "Sheet Music",
  ARTWORK: "Artwork",
  OTHER: "Other",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          setProducts(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  }

  async function handleTogglePublish(
    productId: string,
    isPublished: boolean
  ) {
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isPublished: !isPublished } : p
        )
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => router.push("/dashboard/products/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Product
        </Button>
      </div>

      {loading ? (
        <div className="text-neutral-500 text-sm py-12 text-center">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">
            No products yet. Create your first digital product!
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/dashboard/products/new")}
          >
            Create Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent>
                {product.thumbnailUrl ? (
                  <img
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-neutral-800 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="h-10 w-10 text-neutral-600" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {TYPE_LABELS[product.productType] || product.productType}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-amber-400 flex-shrink-0">
                    {formatCurrency(Number(product.price))}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={product.isPublished ? "success" : "default"}
                    >
                      {product.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {product.downloadCount} downloads
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        handleTogglePublish(product.id, product.isPublished)
                      }
                      className="text-xs text-neutral-500 hover:text-white transition-colors px-2 py-1"
                    >
                      {product.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/products/${product.id}/edit`
                        )
                      }
                      className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
