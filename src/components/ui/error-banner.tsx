import { clsx } from "clsx";
import { Button } from "./button";
import { RestartIcon } from "./icons";

interface ErrorBannerProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorBanner({ message, retryLabel, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger",
        className,
      )}
    >
      <span>{message}</span>
      <Button size="sm" onClick={onRetry}>
        <RestartIcon />
        {retryLabel}
      </Button>
    </div>
  );
}
