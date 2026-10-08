import { SiteHeader } from "@/components/site/site-header";
import { VoiceSetting } from "@/components/speech/voice-picker";
import { OptionMenu } from "@/components/ui/option-menu";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { LlmProviderId, LlmProviderOption } from "@/lib/llm/types";
import { PRESENTER_LABELS, type PresenterId } from "@/lib/presenter/types";
import type { VoiceId } from "@/lib/speech/voices";

interface AppHeaderProps {
  providers: LlmProviderOption[];
  provider: LlmProviderId | undefined;
  onProviderChange: (provider: LlmProviderId) => void;
  presenters: PresenterId[];
  presenter: PresenterId;
  onPresenterChange: (presenter: PresenterId) => void;
  locked: boolean;
  voices: readonly VoiceId[];
}

export function AppHeader({
  providers,
  provider,
  onProviderChange,
  presenters,
  presenter,
  onPresenterChange,
  locked,
  voices,
}: AppHeaderProps) {
  const modelControl = provider && providers.length > 1 && (
    <SegmentedControl
      label="AI model"
      value={provider}
      options={providers.map(({ id, label }) => ({ value: id, label }))}
      onChange={onProviderChange}
      disabled={locked}
      title={locked ? "The AI model is fixed for this round" : undefined}
    />
  );

  const avatarOptions = presenters.map((id) => ({ value: id, label: PRESENTER_LABELS[id] }));
  const avatarLock = locked ? "The avatar is fixed for this round" : undefined;
  const hasAvatarChoice = presenters.length > 1;

  return (
    <SiteHeader
      settings={
        <>
          {modelControl}
          {hasAvatarChoice && (
            <OptionMenu
              label="Avatar"
              value={presenter}
              options={avatarOptions}
              onChange={onPresenterChange}
              disabled={locked}
              title={avatarLock}
            />
          )}
          <VoiceSetting configured={voices} />
        </>
      }
      menuSettings={
        <>
          {modelControl}
          {hasAvatarChoice && (
            <SegmentedControl
              label="Avatar"
              value={presenter}
              options={avatarOptions}
              onChange={onPresenterChange}
              disabled={locked}
              title={avatarLock}
            />
          )}
          <VoiceSetting configured={voices} expanded />
        </>
      }
    />
  );
}
