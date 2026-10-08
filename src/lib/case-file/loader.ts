import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { isValidCaseFileId } from "./id";
import { parseCaseFileHtml } from "./parser";
import type { CaseFileView, ParseResult } from "./types";
import { toCaseFileView } from "./view";

export const CASE_FILES_DIR = path.join(process.cwd(), "case-files");

const DOCX_EXTENSION = ".docx";

export class CaseFileNotFoundError extends Error {
  constructor(id: string) {
    super(`Case file not found: "${id}"`);
    this.name = "CaseFileNotFoundError";
  }
}

export async function parseCaseFileDocx(buffer: Buffer, id: string): Promise<ParseResult> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return parseCaseFileHtml(html, id);
}

export async function listCaseFileIds(directory = CASE_FILES_DIR): Promise<string[]> {
  const fileNames = await readdir(directory);
  return fileNames
    .filter((name) => name.toLowerCase().endsWith(DOCX_EXTENSION) && !name.startsWith("~$"))
    .map((name) => path.basename(name, path.extname(name)))
    .sort();
}

export async function loadCaseFile(id: string, directory = CASE_FILES_DIR): Promise<ParseResult> {
  const ids = await listCaseFileIds(directory);
  if (!ids.includes(id)) throw new CaseFileNotFoundError(id);

  const buffer = await readFile(path.join(directory, `${id}${DOCX_EXTENSION}`));
  return parseCaseFileDocx(buffer, id);
}

export async function listCaseFileViews(directory = CASE_FILES_DIR): Promise<CaseFileView[]> {
  const ids = (await listCaseFileIds(directory)).filter(isValidCaseFileId);
  const results = await Promise.all(ids.map((id) => loadCaseFile(id, directory)));
  return results.flatMap((result) => (result.ok ? [toCaseFileView(result.caseFile)] : []));
}
