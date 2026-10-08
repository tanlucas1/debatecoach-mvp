import { AvatarNotConfiguredError, AvatarServiceError } from "@/lib/presenter/errors";

export async function avatarResponse(run: () => Promise<unknown>): Promise<Response> {
  try {
    return Response.json((await run()) ?? { ok: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AvatarNotConfiguredError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof AvatarServiceError) {
      console.error(error);
      return Response.json({ error: "The avatar is unavailable right now." }, { status: 502 });
    }
    throw error;
  }
}
