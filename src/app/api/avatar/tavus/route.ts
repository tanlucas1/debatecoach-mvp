import { createTavusConversation } from "@/lib/presenter/tavus";
import { avatarResponse } from "../respond";

export const runtime = "nodejs";

export function POST() {
  return avatarResponse(createTavusConversation);
}
