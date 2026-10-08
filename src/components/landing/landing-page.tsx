import { clsx } from "clsx";
import { CONTENT_CONTAINER } from "@/components/site/layout";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ROUTES } from "@/lib/routes";
import { RoundDemo } from "./round-demo";

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader container={CONTENT_CONTAINER} />

      <main
        className={clsx(
          "grid flex-1 items-center gap-10 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16",
          CONTENT_CONTAINER,
        )}
      >
        <div className="flex flex-col gap-5">
          <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
            Practise debating out loud against an AI opponent
          </h1>
          <p className="max-w-[46ch] text-lg leading-relaxed text-muted">
            Argue your side by voice, hear the AI argue back from a real case file, and get feedback
            when the round ends.
          </p>
          <ButtonLink href={ROUTES.practice} variant="primary" size="lg" className="self-start">
            Get started
            <ArrowRightIcon />
          </ButtonLink>
          <p className="text-xs text-muted">For students, debate classes and law schools.</p>
        </div>

        <RoundDemo />
      </main>
    </div>
  );
}
