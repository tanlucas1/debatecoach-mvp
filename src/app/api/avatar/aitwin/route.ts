import { createAiTwinToken } from "@/lib/presenter/aitwin";
import { avatarResponse } from "../respond";

export const runtime = "nodejs";

export function POST() {
  return avatarResponse(async () => ({ token: await createAiTwinToken() }));
}
