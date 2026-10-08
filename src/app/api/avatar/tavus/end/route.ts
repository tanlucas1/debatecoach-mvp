import { z } from "zod";
import { TAVUS_CONVERSATION_ID, endTavusConversation } from "@/lib/presenter/tavus";
import { avatarResponse } from "../../respond";

export const runtime = "nodejs";

const requestSchema = z.object({ conversationId: z.string().regex(TAVUS_CONVERSATION_ID) });

export async function POST(request: Request) {
  const body: unknown = await request
    .text()
    .then((text) => JSON.parse(text))
    .catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  return avatarResponse(() => endTavusConversation(parsed.data.conversationId));
}
