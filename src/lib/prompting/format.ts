import type { ClashAnswer, Contention, EvidenceItem, LabelledText } from "@/lib/case-file/types";

const EVIDENCE_SIDE_LABELS: Record<EvidenceItem["helps"], string> = {
  proposition: "Proposition",
  opposition: "Opposition",
  both: "Both",
};

export const heading = (title: string) => `# ${title}`;

export const subheading = (title: string) => `## ${title}`;

export const bulletList = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

export const labelledList = (items: LabelledText[]) =>
  bulletList(items.map(({ label, text }) => (label ? `${label}: ${text}` : text)));

export const joinSections = (sections: string[]) => sections.filter(Boolean).join("\n\n");

export function formatContention(contention: Contention): string {
  return [
    `${contention.id}. ${contention.title}`,
    `In short: ${contention.summary}`,
    `Warrant: ${contention.warrant}`,
    ...contention.evidence.map((item) => `${item.label}: ${item.text}`),
    `Impact: ${contention.impact}`,
  ].join("\n");
}

export function formatClashAnswer({ targetId, claim, answer }: ClashAnswer): string {
  return `- If they say${targetId ? ` (${targetId})` : ""}: ${claim}\n  Answer: ${answer}`;
}

export function formatEvidence(item: EvidenceItem): string {
  return `- [${item.id}] ${item.fact} (Source: ${item.source}. Helps: ${EVIDENCE_SIDE_LABELS[item.helps]})`;
}
