import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { LogoMark } from "./logo-mark";

export function Logo() {
  return (
    <Link
      href={ROUTES.home}
      aria-label="Debate Coach home"
      className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-you-strong"
    >
      <LogoMark className="size-7 text-you-strong sm:size-9" />
      <span className="translate-y-[0.07em] font-display text-[1.625rem] sm:text-[2rem] leading-none tracking-wide uppercase">
        Debate<span className="text-you-strong">Coach</span>
      </span>
    </Link>
  );
}
