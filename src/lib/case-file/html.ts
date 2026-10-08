import { HTMLElement, NodeType, parse } from "node-html-parser";
import type { LabelledText } from "./types";

export { parse as parseHtml, type HTMLElement };

export const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const trimLabel = (value: string) =>
  normalizeText(value)
    .replace(/^["“”']+/, "")
    .replace(/["“”':.]+$/, "")
    .trim();

const trimLeadingPunctuation = (value: string) => normalizeText(value.replace(/^[\s:,.–-]+/, ""));

export function childElements(element: HTMLElement): HTMLElement[] {
  return element.childNodes.filter(
    (node): node is HTMLElement => node.nodeType === NodeType.ELEMENT_NODE,
  );
}

export const isList = (element: HTMLElement) =>
  element.tagName === "UL" || element.tagName === "OL";

export const listItems = (list: HTMLElement) =>
  childElements(list).filter((child) => child.tagName === "LI");

export function textExcludingNestedLists(element: HTMLElement): string {
  const copy = parse(element.outerHTML).firstChild as HTMLElement;
  copy.querySelectorAll("ul, ol").forEach((list) => list.remove());
  return normalizeText(copy.text);
}

export function readLabelledItem(element: HTMLElement): LabelledText {
  const text = textExcludingNestedLists(element);
  const [first] = childElements(element);

  if (first && (first.tagName === "STRONG" || first.tagName === "B")) {
    const boldText = normalizeText(first.text);
    return {
      label: trimLabel(boldText),
      text: trimLeadingPunctuation(text.slice(boldText.length)),
    };
  }

  const match = text.match(/^([^:]{1,60}):\s*(.*)$/);
  return match ? { label: match[1].trim(), text: match[2] } : { label: "", text };
}

export function isBoldOnlyParagraph(element: HTMLElement): boolean {
  if (element.tagName !== "P") return false;
  const bold = element.querySelector("strong");
  const boldText = bold ? normalizeText(bold.text) : "";
  return boldText !== "" && boldText === normalizeText(element.text);
}

export interface Table {
  header: string[];
  rows: HTMLElement[][];
}

export function readTable(table: HTMLElement): Table {
  const cells = (row: HTMLElement) =>
    childElements(row).filter((cell) => cell.tagName === "TD" || cell.tagName === "TH");
  const [headerRow, ...bodyRows] = table.querySelectorAll("tr");

  return {
    header: headerRow ? cells(headerRow).map((cell) => normalizeText(cell.text).toLowerCase()) : [],
    rows: bodyRows.map(cells),
  };
}
