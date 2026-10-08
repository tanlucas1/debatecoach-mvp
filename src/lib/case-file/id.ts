export const CASE_FILE_ID_PATTERN = /^[\w-]+$/;

export const isValidCaseFileId = (id: string) => CASE_FILE_ID_PATTERN.test(id);

export const suggestCaseFileId = (id: string) =>
  id
    .trim()
    .toLowerCase()
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "");
