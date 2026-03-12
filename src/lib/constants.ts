export const APP_NAME = "ArtistHub";
export const APP_DESCRIPTION = "Eight Powerful Modules. One Unified Platform.";
export const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/aac",
  "audio/ogg",
];

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const PLATFORM_FEE_PERCENT = parseInt(
  process.env.STRIPE_PLATFORM_FEE_PERCENT || "10",
  10
);
