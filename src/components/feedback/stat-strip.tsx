import { clsx } from "clsx";

export interface Stat {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
}

const COLUMNS: Record<number, string> = {
  3: "sm:grid-cols-3",
  5: "sm:grid-cols-5",
};

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl
      className={clsx(
        "grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line",
        COLUMNS[stats.length],
      )}
    >
      {stats.map(({ label, value, hint, alert }) => (
        <div
          key={label}
          className="flex flex-col gap-0.5 bg-raise px-4 py-3 max-sm:odd:last:col-span-2"
        >
          <dt className="text-xs text-muted">{label}</dt>
          <dd
            className={clsx(
              "font-mono text-xl font-bold tabular-nums",
              alert ? "text-danger" : "text-ink",
            )}
          >
            {value}
          </dd>
          {hint && <dd className="text-xs text-muted">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
