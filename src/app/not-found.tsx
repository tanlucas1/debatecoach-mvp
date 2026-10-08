import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { eyebrowStyles } from "@/components/ui/eyebrow";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
        <p className={eyebrowStyles}>Error 404</p>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          This page doesn&apos;t exist
        </h1>
        <p className="max-w-[42ch] text-muted">
          The link may be old or mistyped. Head back home or start a practice round.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ButtonLink href={ROUTES.practice} variant="primary">
            Start practising
            <ArrowRightIcon />
          </ButtonLink>
          <ButtonLink href={ROUTES.home} variant="ghost">
            Back to home
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
