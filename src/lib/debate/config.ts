import type { Side } from "@/lib/case-file/types";
import type { Level, Speaker } from "./types";

export const FIRST_SPEAKER: Speaker = "student";

export const LEVEL_LABELS: Record<Level, string> = {
  jc: "JC",
  secondary: "Secondary",
};

export const LEVEL_HINTS: Record<Level, string> = {
  jc: "Full strength",
  secondary: "Simpler words",
};

export const SIDE_LABELS: Record<Side, string> = {
  proposition: "Proposition",
  opposition: "Opposition",
};

export const SIDE_STANCES: Record<Side, string> = {
  proposition: "for",
  opposition: "against",
};

export const opposingSide = (side: Side): Side =>
  side === "proposition" ? "opposition" : "proposition";
