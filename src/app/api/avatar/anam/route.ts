import { createAnamSession } from "@/lib/presenter/anam";
import { avatarResponse } from "../respond";

export const runtime = "nodejs";

export function POST() {
  return avatarResponse(createAnamSession);
}
