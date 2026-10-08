import { clsx } from "clsx";
import { eyebrowStyles } from "@/components/ui/eyebrow";
import { fieldStyles } from "@/components/ui/field";
import { OptionMenu } from "@/components/ui/option-menu";
import type { CaseFileView, Side } from "@/lib/case-file/types";
import { LEVEL_HINTS, LEVEL_LABELS, SIDE_LABELS, SIDE_STANCES } from "@/lib/debate/config";
import type { DebateSettings, Level } from "@/lib/debate/types";

const SIDE_OPTIONS = (Object.keys(SIDE_LABELS) as Side[]).map((value) => ({
  value,
  label: SIDE_LABELS[value],
  description: SIDE_STANCES[value],
}));

const LEVEL_OPTIONS = (Object.keys(LEVEL_LABELS) as Level[]).map((value) => ({
  value,
  label: LEVEL_LABELS[value],
  description: LEVEL_HINTS[value],
}));

interface RoundSettingsProps {
  settings: DebateSettings;
  onChange: (settings: DebateSettings) => void;
}

export function RoundSettings({ settings, onChange }: RoundSettingsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <OptionMenu
        label="Your side"
        value={settings.studentSide}
        options={SIDE_OPTIONS}
        onChange={(studentSide) => onChange({ ...settings, studentSide })}
      />
      <OptionMenu
        label="Level"
        value={settings.level}
        options={LEVEL_OPTIONS}
        onChange={(level) => onChange({ ...settings, level })}
      />
    </div>
  );
}

interface RoundIntroProps extends RoundSettingsProps {
  caseFiles: CaseFileView[];
  caseFile: CaseFileView;
  compact?: boolean;
}

export function RoundIntro({
  caseFiles,
  caseFile,
  settings,
  onChange,
  compact = false,
}: RoundIntroProps) {
  return (
    <div
      className={clsx(
        "m-auto flex flex-col items-center text-center",
        compact ? "gap-1 p-3" : "w-full max-w-xl gap-3 p-6",
      )}
    >
      <label htmlFor="motion" className={clsx(eyebrowStyles, compact && "text-[0.6rem]")}>
        {caseFiles.length > 1 ? "Choose a motion" : "Today's motion"}
      </label>
      {caseFiles.length > 1 && (
        <select
          id="motion"
          value={caseFile.id}
          onChange={(event) => onChange({ ...settings, caseFileId: event.target.value })}
          className={clsx(fieldStyles, "w-full")}
        >
          {caseFiles.map(({ id, title }) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
      )}
      <h1
        className={clsx(
          "leading-snug font-bold tracking-tight",
          compact ? "text-sm text-pretty sm:text-base" : "text-xl text-balance sm:text-2xl",
        )}
      >
        {caseFile.motion}
      </h1>
      {!compact && (
        <p className="text-sm text-muted">
          You argue {SIDE_STANCES[settings.studentSide]} the motion. Tap the mic or type to begin.
        </p>
      )}
    </div>
  );
}
