import { clsx } from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonVariant = "soft" | "primary" | "action" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-lg";

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const RAISED =
  "shadow-soft hover:-translate-y-px hover:shadow-lifted active:translate-y-px active:shadow-pressed motion-reduce:hover:translate-y-0";

const VARIANTS: Record<ButtonVariant, string> = {
  soft: clsx(RAISED, "border border-line bg-raise text-ink"),
  primary: clsx(RAISED, "border border-transparent bg-you text-on-you"),
  action: clsx(RAISED, "border border-transparent bg-action text-on-action"),
  ghost: "text-muted hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "rounded-full px-4 py-1.5 text-sm",
  md: "rounded-full px-5 py-2.5 text-sm",
  lg: "rounded-full px-7 py-3.5 text-base",
  icon: "size-9 rounded-full",
  "icon-lg": "size-12 rounded-full [&_svg]:size-5",
};

export function buttonStyles({ variant = "soft", size = "md", className }: ButtonStyleOptions) {
  return clsx(
    "group inline-flex cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap transition duration-150 motion-reduce:transition-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-you-strong",
    "disabled:pointer-events-none disabled:border-line disabled:bg-panel disabled:text-muted disabled:shadow-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & ButtonStyleOptions;

export function Button({ variant, size, type = "button", className, ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleOptions;

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
