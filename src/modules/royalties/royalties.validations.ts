import { z } from "zod";

export const COLLABORATOR_ROLES = [
  "producer",
  "songwriter",
  "vocalist",
  "featured",
  "mixer",
  "mastering",
  "composer",
  "lyricist",
  "other",
] as const;

export const addSplitSchema = z.object({
  trackId: z.string().min(1),
  recipientName: z.string().min(1, "Name is required").max(200),
  recipientEmail: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
  percentage: z
    .number()
    .min(0.01, "Percentage must be greater than 0")
    .max(100, "Percentage cannot exceed 100"),
});

export const updateSplitSchema = z.object({
  recipientName: z.string().min(1).max(200).optional(),
  role: z.string().min(1).optional(),
  percentage: z.number().min(0.01).max(100).optional(),
});

export type AddSplitInput = z.infer<typeof addSplitSchema>;
export type UpdateSplitInput = z.infer<typeof updateSplitSchema>;
