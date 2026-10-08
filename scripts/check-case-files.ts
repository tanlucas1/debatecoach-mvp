import {
  isValidCaseFileId,
  listCaseFileIds,
  loadCaseFile,
  suggestCaseFileId,
} from "../src/lib/case-file";

async function main() {
  const ids = await listCaseFileIds();
  if (ids.length === 0) {
    console.error("No .docx files found in case-files/.");
    process.exitCode = 1;
    return;
  }

  for (const id of ids) {
    if (!isValidCaseFileId(id)) {
      console.log(`
FAIL  ${id}`);
      console.log(
        `      ERROR  File name: "${id}.docx" can only use letters, numbers, hyphens and underscores. ` +
          `Rename it to "${suggestCaseFileId(id)}.docx".`,
      );
      process.exitCode = 1;
      continue;
    }

    const result = await loadCaseFile(id);
    console.log(`\n${result.ok ? "PASS" : "FAIL"}  ${id}`);

    if (result.ok) {
      const { sides, evidence, glossary } = result.caseFile;
      console.log(
        `      ${sides.proposition.contentions.length} proposition and ` +
          `${sides.opposition.contentions.length} opposition contentions, ` +
          `${evidence.length} evidence items, ${glossary.length} glossary terms`,
      );
    } else {
      process.exitCode = 1;
    }

    for (const issue of result.issues) {
      console.log(`      ${issue.severity.toUpperCase()}  ${issue.location}: ${issue.message}`);
    }
  }
}

main();
