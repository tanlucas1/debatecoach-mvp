export const PRESENTER_IDS = ["voice", "anam", "aitwin", "tavus"] as const;

export type PresenterId = (typeof PRESENTER_IDS)[number];

export const PRESENTER_LABELS: Record<PresenterId, string> = {
  voice: "Voice",
  anam: "Anam",
  aitwin: "AI Twin",
  tavus: "Tavus",
};

export type PresenterConfig =
  | { id: "voice" }
  | { id: "anam" }
  | { id: "aitwin"; twinId: string; voiceId?: string }
  | { id: "tavus" };
