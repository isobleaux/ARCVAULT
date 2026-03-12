import { z } from "zod";

export const createArtistSchema = z.object({
  name: z.string().min(1, "Artist name is required").max(100),
  slug: z
    .string()
    .min(1, "URL slug is required")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  bio: z.string().max(2000).optional(),
  genre: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
});

export const updateArtistSchema = createArtistSchema.partial().extend({
  avatarUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  isPublished: z.boolean().optional(),
});

export type CreateArtistInput = z.infer<typeof createArtistSchema>;
export type UpdateArtistInput = z.infer<typeof updateArtistSchema>;
