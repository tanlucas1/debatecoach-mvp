import type { CaseFile } from "@/lib/case-file/types";

const DEBATE_TERMS = [
  "opponent",
  "Proposition",
  "Opposition",
  "motion",
  "rebuttal",
  "contention",
  "burden of proof",
];

const MAX_KEYTERMS = 80;
const MAX_TOPIC_PHRASES = 20;
const MAX_TOPIC_WORDS = 20;
const MIN_PHRASE_OCCURRENCES = 3;
const MIN_WORD_OCCURRENCES = 4;
const MIN_TOPIC_WORD_LENGTH = 5;

const LEADING_FUNCTION_WORDS = new Set([
  "A",
  "An",
  "The",
  "In",
  "By",
  "Only",
  "Over",
  "About",
  "When",
  "If",
]);

const STOP_WORDS = new Set(
  (
    "a about after again against all also an and any are as at be because been before being between both but by can " +
    "cannot could did do does doing down during each even every few for from further get gets had has have having " +
    "how if in into is it its itself just less may more most much must no nor not now of off on once one only " +
    "or other our out over own per same should so some still such than that the their them then there these they " +
    "this those through to too under until up very was we were what when where which while who why will with would " +
    "you your yes says said say make makes made many way ways well whether give gives everyone"
  ).split(" "),
);

const MONTH_PATTERN = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*$/;
const CAPITALISED_PHRASE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
const MID_SENTENCE_NAME = /(?<=[a-z,;:]\s)[A-Z][a-z]+\b/g;
const ACRONYM_OR_CAMEL = /\b(?:[A-Z]{2,}[a-z]?|[a-z]+[A-Z][A-Za-z]*)\b/g;
const WORD = /[a-z]+(?:-[a-z0-9]+)*/g;
const CLAUSE_BREAK = /[.,;:!?()"“”—]+/;

function trimLeadingFunctionWords(phrase: string): string {
  const words = phrase.split(/\s+/);
  while (words.length > 1 && LEADING_FUNCTION_WORDS.has(words[0])) words.shift();
  return words.join(" ");
}

function namedTerms(text: string): string[] {
  return [
    ...(text.match(CAPITALISED_PHRASE) ?? []).map(trimLeadingFunctionWords),
    ...(text.match(MID_SENTENCE_NAME) ?? []),
    ...(text.match(ACRONYM_OR_CAMEL) ?? []),
  ];
}

function topicTerms(texts: string[]): string[] {
  const phraseCounts = new Map<string, number>();
  const wordCounts = new Map<string, number>();
  const increment = (counts: Map<string, number>, term: string) =>
    counts.set(term, (counts.get(term) ?? 0) + 1);
  const isContentWord = (word: string | undefined): word is string =>
    word !== undefined && word.length > 2 && !STOP_WORDS.has(word);

  const clauses = new Set(texts.flatMap((text) => text.toLowerCase().split(CLAUSE_BREAK)));
  for (const clause of clauses) {
    const words = clause.match(WORD) ?? [];
    words.forEach((word, index) => {
      const next = words[index + 1];
      if (isContentWord(word) && word.length >= MIN_TOPIC_WORD_LENGTH) increment(wordCounts, word);
      if (isContentWord(word) && isContentWord(next)) increment(phraseCounts, `${word} ${next}`);
    });
  }

  const top = (counts: Map<string, number>, minimum: number, limit: number) =>
    [...counts]
      .filter(([, occurrences]) => occurrences >= minimum)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term]) => term);

  const phrases = top(phraseCounts, MIN_PHRASE_OCCURRENCES, MAX_TOPIC_PHRASES);
  const wordsInPhrases = new Set(phrases.flatMap((phrase) => phrase.split(" ")));
  const words = top(wordCounts, MIN_WORD_OCCURRENCES, MAX_TOPIC_WORDS).filter(
    (word) => !wordsInPhrases.has(word),
  );
  return [...phrases, ...words];
}

function caseFileTexts(caseFile: CaseFile): string[] {
  const contentions = [
    ...caseFile.sides.proposition.contentions,
    ...caseFile.sides.opposition.contentions,
  ];
  return [
    caseFile.motion,
    ...contentions.flatMap(({ title, summary, warrant, impact, evidence }) => [
      title,
      summary,
      warrant,
      impact,
      ...evidence.map(({ text }) => text),
    ]),
    ...[...caseFile.clash.answers.proposition, ...caseFile.clash.answers.opposition].flatMap(
      ({ claim, answer }) => [claim, answer],
    ),
    ...caseFile.framework.definitions.map(({ text }) => text),
    ...caseFile.evidence.map(({ fact }) => fact),
  ];
}

export function caseFileKeyterms(caseFile: CaseFile): string[] {
  const namedSources = [
    ...caseFile.evidence.flatMap(({ fact, source }) => [fact, source]),
    ...[
      ...caseFile.sides.proposition.contentions,
      ...caseFile.sides.opposition.contentions,
    ].flatMap(({ evidence }) => evidence.map(({ text }) => text)),
  ];

  const names = [
    ...caseFile.glossary.map(({ label }) => label),
    ...namedSources.flatMap(namedTerms),
  ];
  const nameWords = new Set(
    names.filter((term) => term.includes(" ")).flatMap((term) => term.toLowerCase().split(" ")),
  );
  const isNameFragment = (term: string) =>
    MONTH_PATTERN.test(term) || (!term.includes(" ") && nameWords.has(term.toLowerCase()));

  const terms = [
    ...names.filter((term) => !isNameFragment(term)),
    ...topicTerms(caseFileTexts(caseFile)),
    ...DEBATE_TERMS,
  ];

  const unique = new Map<string, string>();
  for (const term of terms) {
    const key = term.toLowerCase();
    if (!unique.has(key)) unique.set(key, term);
  }
  return [...unique.values()].slice(0, MAX_KEYTERMS);
}
