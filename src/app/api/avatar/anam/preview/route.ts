import { getAnamPreview } from "@/lib/presenter/anam";
import { avatarResponse } from "../../respond";

export const runtime = "nodejs";

export function GET() {
  return avatarResponse(getAnamPreview);
}
