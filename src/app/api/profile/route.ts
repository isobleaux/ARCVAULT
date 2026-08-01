import { ok, route } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { profileSchema } from "@/modules/diary/validations";
import { getProfile, saveProfile, targetsFor } from "@/modules/profile/service";

export const GET = route(async () => {
  const userId = await requireUserId();
  return ok({ profile: await getProfile(userId) });
});

export const POST = route(async (request: Request) => {
  const userId = await requireUserId();
  const input = profileSchema.parse(await request.json());
  const profile = await saveProfile(userId, input);
  return ok({ profile, computed: targetsFor(input) });
});
