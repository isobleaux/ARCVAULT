import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional(),
  productType: z.enum([
    "BEAT",
    "SAMPLE_PACK",
    "PRESET",
    "STEM",
    "SHEET_MUSIC",
    "ARTWORK",
    "OTHER",
  ]),
  fileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
  maxDownloads: z.number().int().positive().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
