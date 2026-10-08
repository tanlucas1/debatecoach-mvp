import {
  childElements,
  isBoldOnlyParagraph,
  isList,
  listItems,
  normalizeText,
  parseHtml,
  readLabelledItem,
  readTable,
  type HTMLElement,
} from "./html";
import type {
  CaseFileIssue,
  ClashAnswer,
  Contention,
  DeveloperNote,
  EvidenceItem,
  EvidenceSide,
  ExpectedClash,
  Framework,
  LabelledText,
  ParseResult,
  Side,
  SideCase,
} from "./types";

type SectionKey =
  | "motion"
  | "framework"
  | "proposition"
  | "opposition"
  | "clash"
  | "evidence"
  | "glossary"
  | "notes";

type Sections = Map<SectionKey, HTMLElement[]>;

const SECTION_HEADINGS: Record<SectionKey, string> = {
  motion: "Motion",
  framework: "Definitions",
  proposition: "Proposition case",
  opposition: "Opposition case",
  clash: "Expected clash",
  evidence: "Evidence bank",
  glossary: "Glossary",
  notes: "Notes for the developer",
};

const REQUIRED_SECTIONS: SectionKey[] = ["motion", "proposition", "opposition", "evidence"];

const SIDE_LABEL: Record<Side, string> = {
  proposition: "Proposition case",
  opposition: "Opposition case",
};

const CONTENTION_PREFIX: Record<Side, string> = { proposition: "P", opposition: "O" };

const CONTENTION_ID = /^([PO]\d+)\.?\s*(.*)$/i;

class IssueLog {
  readonly issues: CaseFileIssue[] = [];

  error(location: string, message: string) {
    this.issues.push({ severity: "error", location, message });
  }

  warn(location: string, message: string) {
    this.issues.push({ severity: "warning", location, message });
  }

  get hasErrors() {
    return this.issues.some((issue) => issue.severity === "error");
  }
}

export function parseCaseFileHtml(html: string, id: string): ParseResult {
  const log = new IssueLog();
  const { title, sections } = splitSections(parseHtml(html), log);

  for (const key of REQUIRED_SECTIONS) {
    if (!sections.has(key)) {
      log.error("File", `Missing section with a Heading 2 starting "${SECTION_HEADINGS[key]}".`);
    }
  }

  const { motion, usage } = parseMotion(sections.get("motion"), log);
  const sides = {
    proposition: parseSide(sections.get("proposition"), "proposition", log),
    opposition: parseSide(sections.get("opposition"), "opposition", log),
  };
  const framework = parseFramework(sections.get("framework"), log);
  const clash = parseClash(sections.get("clash"), sides, log);
  const evidence = parseEvidence(sections.get("evidence"), log);
  const glossary = parseGlossary(sections.get("glossary"), log);
  const developerNotes = parseDeveloperNotes(sections.get("notes"), log);

  if (log.hasErrors) return { ok: false, issues: log.issues };

  return {
    ok: true,
    issues: log.issues,
    caseFile: {
      id,
      title: title || motion,
      motion,
      usage,
      framework,
      sides,
      clash,
      evidence,
      glossary,
      developerNotes,
    },
  };
}

function splitSections(root: HTMLElement, log: IssueLog) {
  const sections: Sections = new Map();
  let title = "";
  let current: HTMLElement[] | null = null;

  for (const element of childElements(root)) {
    if (element.tagName === "H1") {
      title ||= normalizeText(element.text).replace(/^case file:\s*/i, "");
    } else if (element.tagName === "H2") {
      const heading = normalizeText(element.text);
      const key = findSectionKey(heading);
      if (key) {
        current = [];
        sections.set(key, current);
      } else {
        current = null;
        log.warn(heading, "Unrecognised section heading. Its content is ignored.");
      }
    } else {
      current?.push(element);
    }
  }

  if (!title) log.warn("File", "No Heading 1 title found.");
  return { title, sections };
}

function findSectionKey(heading: string): SectionKey | undefined {
  const lower = heading.toLowerCase();
  return (Object.keys(SECTION_HEADINGS) as SectionKey[]).find((key) =>
    lower.startsWith(SECTION_HEADINGS[key].toLowerCase()),
  );
}

function parseMotion(elements: HTMLElement[] | undefined, log: IssueLog) {
  let motion = "";
  const usage: LabelledText[] = [];

  for (const element of elements ?? []) {
    const match = normalizeText(element.text).match(/^motion:\s*(.+)$/i);
    if (element.tagName === "P" && match) motion = match[1];
    else if (isList(element)) usage.push(...listItems(element).map(readLabelledItem));
  }

  if (elements && !motion) log.error("Motion", 'No paragraph starting "Motion:".');
  return { motion, usage };
}

function parseFramework(elements: HTMLElement[] | undefined, log: IssueLog): Framework {
  const framework: Framework = { intro: "", definitions: [], burdens: [], weighing: [] };
  let bucket: LabelledText[] | null = null;

  for (const element of elements ?? []) {
    if (isBoldOnlyParagraph(element)) {
      const heading = normalizeText(element.text).toLowerCase();
      if (heading.startsWith("definition")) bucket = framework.definitions;
      else if (heading.startsWith("burden")) bucket = framework.burdens;
      else if (heading.includes("weigh")) bucket = framework.weighing;
      else {
        bucket = null;
        log.warn("Definitions and framework", `Unrecognised sub-heading "${heading}".`);
      }
    } else if (isList(element)) {
      bucket?.push(...listItems(element).map(readLabelledItem));
    } else if (element.tagName === "P" && !bucket) {
      framework.intro = normalizeText(`${framework.intro} ${element.text}`);
    }
  }

  if (elements && framework.definitions.length === 0) {
    log.warn("Definitions and framework", "No definitions found.");
  }
  return framework;
}

function parseSide(elements: HTMLElement[] | undefined, side: Side, log: IssueLog): SideCase {
  const result: SideCase = { coreStory: "", contentions: [] };
  const sideLabel = SIDE_LABEL[side];
  let contention: Contention | null = null;

  const commit = () => {
    if (!contention) return;
    validateContention(contention, `${sideLabel} ${contention.id}`, log);
    result.contentions.push(contention);
  };

  for (const element of elements ?? []) {
    if (element.tagName === "H3") {
      commit();
      contention = startContention(normalizeText(element.text), side, log);
    } else if (element.tagName === "P") {
      const text = normalizeText(element.text);
      const summary = text.match(/^in plain english:\s*(.*)$/i);
      if (!contention) result.coreStory = normalizeText(`${result.coreStory} ${text}`);
      else if (summary) contention.summary = summary[1];
    } else if (isList(element) && contention) {
      for (const item of listItems(element).map(readLabelledItem)) {
        addContentionPart(contention, item, `${sideLabel} ${contention.id}`, log);
      }
    }
  }
  commit();

  if (elements && result.contentions.length === 0) log.error(sideLabel, "No contentions found.");
  return result;
}

function startContention(heading: string, side: Side, log: IssueLog): Contention | null {
  const prefix = CONTENTION_PREFIX[side];
  const match = heading.match(CONTENTION_ID);

  if (!match) {
    log.error(SIDE_LABEL[side], `Heading "${heading}" must start with an id such as "${prefix}1."`);
    return null;
  }

  const id = match[1].toUpperCase();
  if (!id.startsWith(prefix)) {
    log.warn(SIDE_LABEL[side], `Contention ${id} should use the "${prefix}" prefix.`);
  }
  return { id, title: match[2], summary: "", warrant: "", evidence: [], impact: "" };
}

function addContentionPart(
  contention: Contention,
  item: LabelledText,
  location: string,
  log: IssueLog,
) {
  const label = item.label.toLowerCase();
  if (label === "warrant") contention.warrant = item.text;
  else if (label === "impact") contention.impact = item.text;
  else if (label.includes("evidence")) contention.evidence.push(item);
  else log.warn(location, `Unrecognised bullet "${item.label || item.text.slice(0, 40)}" ignored.`);
}

function validateContention(contention: Contention, location: string, log: IssueLog) {
  if (!contention.summary) log.error(location, 'Missing the "In plain English:" line.');
  if (!contention.warrant) log.error(location, 'Missing a "Warrant:" bullet.');
  if (contention.evidence.length === 0) log.error(location, 'Missing an "Evidence:" bullet.');
  if (!contention.impact) log.error(location, 'Missing an "Impact:" bullet.');
}

function parseClash(
  elements: HTMLElement[] | undefined,
  sides: Record<Side, SideCase>,
  log: IssueLog,
): ExpectedClash {
  const clash: ExpectedClash = {
    intro: "",
    answers: { proposition: [], opposition: [] },
    keyPoints: [],
  };

  if (!elements) {
    log.warn("File", 'No "Expected clash" section. The AI will have no prepared answers.');
    return clash;
  }

  let subsection: Side | "keyPoints" | null = null;
  for (const element of elements) {
    if (element.tagName === "H3") {
      subsection = clashSubsection(normalizeText(element.text));
      if (!subsection) log.warn("Expected clash", `Unrecognised sub-heading "${element.text}".`);
    } else if (
      element.tagName === "TABLE" &&
      (subsection === "proposition" || subsection === "opposition")
    ) {
      clash.answers[subsection].push(...readClashTable(element));
    } else if (isList(element) && subsection === "keyPoints") {
      clash.keyPoints.push(...listItems(element).map(readLabelledItem));
    } else if (element.tagName === "P" && !subsection) {
      clash.intro = normalizeText(`${clash.intro} ${element.text}`);
    }
  }

  const contentionIds = new Set(
    [...sides.proposition.contentions, ...sides.opposition.contentions].map((c) => c.id),
  );
  for (const side of ["proposition", "opposition"] as const) {
    if (clash.answers[side].length === 0) {
      log.warn("Expected clash", `No answers table for ${side}.`);
    }
    for (const { targetId } of clash.answers[side]) {
      if (targetId && !contentionIds.has(targetId)) {
        log.warn(
          "Expected clash",
          `A row answers ${targetId}, which is not a contention in this file.`,
        );
      }
    }
  }
  return clash;
}

function clashSubsection(heading: string): Side | "keyPoints" | null {
  const lower = heading.toLowerCase();
  if (lower.startsWith("proposition")) return "proposition";
  if (lower.startsWith("opposition")) return "opposition";
  if (lower.startsWith("key")) return "keyPoints";
  return null;
}

function readClashTable(table: HTMLElement): ClashAnswer[] {
  return readTable(table)
    .rows.filter((row) => row.length >= 2)
    .map(([claimCell, answerCell]) => {
      const claim = normalizeText(claimCell.text);
      const match = claim.match(/^([PO]\d+)\s*:\s*(.*)$/i);
      return {
        targetId: match ? match[1].toUpperCase() : null,
        claim: match ? match[2] : claim,
        answer: normalizeText(answerCell.text),
      };
    });
}

function parseEvidence(elements: HTMLElement[] | undefined, log: IssueLog): EvidenceItem[] {
  if (!elements) return [];

  const table = elements.find((element) => element.tagName === "TABLE");
  if (!table) {
    log.error("Evidence bank", "No table found.");
    return [];
  }

  const { header, rows } = readTable(table);
  const column = (name: string) => header.findIndex((cell) => cell.startsWith(name));
  const [factColumn, helpsColumn, sourceColumn] = [
    column("fact"),
    column("helps"),
    column("source"),
  ];

  if (factColumn < 0 || helpsColumn < 0 || sourceColumn < 0) {
    log.error(
      "Evidence bank",
      `Table header must be "Fact | Helps | Source", found "${header.join(" | ")}".`,
    );
    return [];
  }

  const evidence: EvidenceItem[] = [];
  rows.forEach((row, index) => {
    const fact = normalizeText(row[factColumn]?.text ?? "");
    if (!fact) return;

    const location = `Evidence bank row ${index + 1}`;
    const helpsText = normalizeText(row[helpsColumn]?.text ?? "");
    const helps = parseEvidenceSide(helpsText);
    const source = normalizeText(row[sourceColumn]?.text ?? "");

    if (!helps) log.error(location, `"Helps" must be Prop, Opp or Both, found "${helpsText}".`);
    if (!source) log.warn(location, "No source given.");

    evidence.push({
      id: `E${evidence.length + 1}`,
      fact,
      helps: helps ?? "both",
      source,
      sourceUrl: row[sourceColumn]?.querySelector("a")?.getAttribute("href") ?? null,
    });
  });

  if (evidence.length === 0) log.error("Evidence bank", "The table has no rows.");
  return evidence;
}

function parseEvidenceSide(value: string): EvidenceSide | null {
  const lower = value.toLowerCase();
  if (lower.startsWith("both")) return "both";
  if (lower.startsWith("prop")) return "proposition";
  if (lower.startsWith("opp")) return "opposition";
  return null;
}

function parseGlossary(elements: HTMLElement[] | undefined, log: IssueLog): LabelledText[] {
  const table = elements?.find((element) => element.tagName === "TABLE");
  const glossary = table
    ? readTable(table)
        .rows.filter((row) => row.length >= 2 && normalizeText(row[0].text))
        .map(([term, meaning]) => ({
          label: normalizeText(term.text),
          text: normalizeText(meaning.text),
        }))
    : [];

  if (glossary.length === 0) log.warn("Glossary", "No glossary table found.");
  return glossary;
}

function parseDeveloperNotes(elements: HTMLElement[] | undefined, log: IssueLog): DeveloperNote[] {
  const notes = (elements ?? []).filter(isList).flatMap((list) =>
    listItems(list).map((item) => {
      const nested = item.querySelector("ul, ol");
      return {
        ...readLabelledItem(item),
        children: nested ? listItems(nested).map(readLabelledItem) : [],
      };
    }),
  );

  if (notes.length === 0) log.warn("Notes for the developer", "No notes found.");
  return notes;
}
