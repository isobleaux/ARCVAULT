import { z } from "zod";

export const createTrackSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  duration: z.number().int().positive().optional(),
  fileUrl: z.string().min(1, "Audio file is required"),
  fileSize: z.number().int().positive().optional(),
  fileFormat: z.string().optional(),
  coverUrl: z.string().optional(),
  genre: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  lyrics: z.string().optional(),
  isPublished: z.boolean().optional(),
  isDownloadable: z.boolean().optional(),
  price: z.number().min(0).optional(),
  albumId: z.string().optional(),
});

export const updateTrackSchema = createTrackSchema.partial();

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
