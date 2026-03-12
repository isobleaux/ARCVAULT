"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { UploadDropzone } from "@/components/music/UploadDropzone";
import { ArrowLeft } from "lucide-react";

const PRODUCT_TYPES = [
  { value: "BEAT", label: "Beat" },
  { value: "SAMPLE_PACK", label: "Sample Pack" },
  { value: "PRESET", label: "Preset" },
  { value: "STEM", label: "Stem" },
  { value: "SHEET_MUSIC", label: "Sheet Music" },
  { value: "ARTWORK", label: "Artwork" },
  { value: "OTHER", label: "Other" },
];

export default function EditProductPage() {
  const router = useRouter();
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    compareAtPrice: "",
    productType: "BEAT",
    fileUrl: "",
    thumbnailUrl: "",
    isPublished: false,
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          setError("Product not found");
          return;
        }
        const product = await res.json();
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          price: String(product.price),
          compareAtPrice: product.compareAtPrice
            ? String(product.compareAtPrice)
            : "",
          productType: product.productType,
          fileUrl: product.fileUrl || "",
          thumbnailUrl: product.thumbnailUrl || "",
          isPublished: product.isPublished,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "audio");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, fileUrl: url }));
    }
  }

  async function handleThumbnailUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "image");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, thumbnailUrl: url }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice
            ? parseFloat(form.compareAtPrice)
            : undefined,
          productType: form.productType,
          fileUrl: form.fileUrl || undefined,
          thumbnailUrl: form.thumbnailUrl || undefined,
          isPublished: form.isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.push("/dashboard/products");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-neutral-500 text-sm py-12 text-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/dashboard/products")}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </button>

      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardTitle className="mb-4">Product Details</CardTitle>
          <CardContent className="space-y-4">
            <Input
              label="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="URL Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Product Type
              </label>
              <select
                value={form.productType}
                onChange={(e) =>
                  setForm({ ...form, productType: e.target.value })
                }
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <Input
                label="Compare at Price ($)"
                type="number"
                step="0.01"
                min="0"
                value={form.compareAtPrice}
                onChange={(e) =>
                  setForm({ ...form, compareAtPrice: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Files</CardTitle>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Product File
              </label>
              <UploadDropzone
                onFileSelected={handleFileUpload}
                label="Drop your product file here"
                currentFile={form.fileUrl ? "File uploaded" : undefined}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Thumbnail
              </label>
              {form.thumbnailUrl && (
                <img
                  src={form.thumbnailUrl}
                  alt="Thumbnail"
                  className="h-32 w-32 rounded-lg object-cover mb-2"
                />
              )}
              <UploadDropzone
                accept="image/*"
                onFileSelected={handleThumbnailUpload}
                label="Upload thumbnail image"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-4">Publishing</CardTitle>
          <CardContent>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
                className="rounded border-neutral-700 bg-neutral-800"
              />
              Published
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" isLoading={saving}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
