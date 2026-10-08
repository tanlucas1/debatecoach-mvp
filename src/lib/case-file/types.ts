export type Side = "proposition" | "opposition";

export type EvidenceSide = "proposition" | "opposition" | "both";

export interface LabelledText {
  label: string;
  text: string;
}

export interface Contention {
  id: string;
  title: string;
  summary: string;
  warrant: string;
  evidence: LabelledText[];
  impact: string;
}

export interface SideCase {
  coreStory: string;
  contentions: Contention[];
}

export interface ClashAnswer {
  targetId: string | null;
  claim: string;
  answer: string;
}

export interface EvidenceItem {
  id: string;
  fact: string;
  helps: EvidenceSide;
  source: string;
  sourceUrl: string | null;
}

export interface DeveloperNote extends LabelledText {
  children: LabelledText[];
}

export interface Framework {
  intro: string;
  definitions: LabelledText[];
  burdens: LabelledText[];
  weighing: LabelledText[];
}

export interface ExpectedClash {
  intro: string;
  answers: Record<Side, ClashAnswer[]>;
  keyPoints: LabelledText[];
}

export interface CaseFile {
  id: string;
  title: string;
  motion: string;
  usage: LabelledText[];
  framework: Framework;
  sides: Record<Side, SideCase>;
  clash: ExpectedClash;
  evidence: EvidenceItem[];
  glossary: LabelledText[];
  developerNotes: DeveloperNote[];
}

export interface CaseFileIssue {
  severity: "error" | "warning";
  location: string;
  message: string;
}

export type ParseResult =
  | { ok: true; caseFile: CaseFile; issues: CaseFileIssue[] }
  | { ok: false; issues: CaseFileIssue[] };

export type ContentionSummary = Pick<Contention, "id" | "title" | "summary">;

export interface CaseFileView {
  id: string;
  title: string;
  motion: string;
  coreStories: Record<Side, string>;
  guidance: LabelledText[];
  contentions: Record<Side, ContentionSummary[]>;
  evidence: Pick<EvidenceItem, "id" | "fact" | "helps" | "source">[];
}
