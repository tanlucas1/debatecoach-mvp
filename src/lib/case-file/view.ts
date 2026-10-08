import type { CaseFile, CaseFileView, Contention } from "./types";

const summarize = ({ id, title, summary }: Contention) => ({ id, title, summary });

const withoutLabel = (story: string) => story.replace(/^[^:]{1,40}core story:\s*/i, "");

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function toCaseFileView(caseFile: CaseFile): CaseFileView {
  return {
    id: caseFile.id,
    title: caseFile.title,
    motion: caseFile.motion,
    coreStories: {
      proposition: capitalise(withoutLabel(caseFile.sides.proposition.coreStory)),
      opposition: capitalise(withoutLabel(caseFile.sides.opposition.coreStory)),
    },
    guidance: caseFile.developerNotes.flatMap(({ children }) => children),
    contentions: {
      proposition: caseFile.sides.proposition.contentions.map(summarize),
      opposition: caseFile.sides.opposition.contentions.map(summarize),
    },
    evidence: caseFile.evidence.map(({ id, fact, helps, source }) => ({ id, fact, helps, source })),
  };
}
