import { z } from "zod";
import { gradeRequestSchema, type GradeRequest, type GradingReport } from "@/lib/grading";

export const SESSION_STORAGE_KEY = "debate-coach-session";
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const savedSessionSchema = z.discriminatedUnion("screen", [
  z.object({
    screen: z.literal("round"),
    request: gradeRequestSchema,
    savedAt: z.number(),
  }),
  z.object({
    screen: z.literal("feedback"),
    request: gradeRequestSchema,
    report: z
      .custom<GradingReport>((value) => typeof value === "object" && value !== null)
      .optional(),
    savedAt: z.number(),
  }),
]);

export type SavedSession = z.infer<typeof savedSessionSchema>;

type SessionInput =
  | { screen: "round"; request: GradeRequest }
  | { screen: "feedback"; request: GradeRequest; report?: GradingReport };

export function parseSession(raw: string | null, now?: number): SavedSession | null {
  if (!raw) return null;
  try {
    const parsed = savedSessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (now !== undefined && now - parsed.data.savedAt > SESSION_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function readStoredSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return parseSession(raw, Date.now()) ? raw : null;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionInput) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    // Storage can be full or blocked; the round still works without it.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}
