import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { eyebrowStyles } from "@/components/ui/eyebrow";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { CaseFileView, Side } from "@/lib/case-file/types";
import { SIDE_LABELS } from "@/lib/debate/config";

interface CaseProps {
  caseFile: CaseFileView;
  side: Side;
}

export function CaseRail(props: CaseProps) {
  return (
    <aside
      aria-label="Your case"
      className="hidden min-h-0 w-72 shrink-0 flex-col overflow-y-auto border-r border-line bg-bg/40 p-4 md:flex"
    >
      <CaseDetails {...props} />
    </aside>
  );
}

export function CaseDetails({ caseFile, side }: CaseProps) {
  const evidence = caseFile.evidence.filter(({ helps }) => helps === side || helps === "both");

  return (
    <div className="flex flex-col gap-2">
      <h2 className={eyebrowStyles}>Your case · {SIDE_LABELS[side]}</h2>
      <ul className="flex flex-col divide-y divide-line">
        {caseFile.contentions[side].map(({ id, title, summary }) => (
          <CaseItem key={id} id={id} title={title}>
            {summary}
          </CaseItem>
        ))}
      </ul>

      <h2 className={clsx(eyebrowStyles, "mt-3")}>Evidence you can use</h2>
      <ul className="flex flex-col divide-y divide-line">
        {evidence.map(({ id, fact, source }) => (
          <CaseItem key={id} id={id} title={fact} tone="highlight">
            Source: {source}
          </CaseItem>
        ))}
      </ul>
    </div>
  );
}

interface CaseItemProps {
  id: string;
  title: string;
  tone?: BadgeTone;
  children: ReactNode;
}

function CaseItem({ id, title, tone = "you", children }: CaseItemProps) {
  return (
    <li>
      <details className="group/item">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-2 text-xs font-semibold hover:text-you-strong focus-visible:outline-2 focus-visible:outline-you-strong [&::-webkit-details-marker]:hidden">
          <Badge tone={tone} code>
            {id}
          </Badge>
          <span className="min-w-0 flex-1 truncate group-open/item:whitespace-normal">{title}</span>
          <ChevronRightIcon className="size-3.5 shrink-0 text-muted group-open/item:rotate-90" />
        </summary>
        <p className="pb-2.5 pl-9 text-xs leading-relaxed text-muted first-letter:uppercase">
          {children}
        </p>
      </details>
    </li>
  );
}
