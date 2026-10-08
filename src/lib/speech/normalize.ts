const CURRENCY_NAMES: Record<string, string> = {
  A$: "Australian dollars",
  S$: "Singapore dollars",
  US$: "US dollars",
};

const CURRENCY_AMOUNT = /\b(A|S|US)\$(\d[\d,.]*)(\s(?:thousand|million|billion|trillion))?/g;

const REPLACEMENTS: [RegExp, string][] = [
  [/(\p{L})-(\d)/gu, "$1 $2"],
  [/(\d)-(\p{L})/gu, "$1 $2"],
  [/(\d)-(?=\s)/g, "$1"],
  [/\s*[—–]\s*/g, ", "],
  [/\bvs\.?(?=\s)/gi, "versus"],
  [/\be\.g\.,?/gi, "for example"],
  [/\bi\.e\.,?/gi, "that is"],
];

export function normalizeForSpeech(text: string): string {
  const withCurrency = text.replace(
    CURRENCY_AMOUNT,
    (_, prefix: string, amount: string, scale = "") =>
      `${amount}${scale} ${CURRENCY_NAMES[`${prefix}$`]}`,
  );
  return REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    withCurrency,
  );
}
