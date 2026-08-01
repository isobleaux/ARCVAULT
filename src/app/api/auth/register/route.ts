import bcrypt from "bcryptjs";

import { fail, ok, route } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/modules/diary/validations";

export const POST = route(async (request: Request) => {
  const body = registerSchema.parse(await request.json());

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return fail("An account with that email already exists.", 409);
  }

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash: await bcrypt.hash(body.password, 12),
    },
    select: { id: true, email: true, name: true },
  });

  return ok({ user }, 201);
});
