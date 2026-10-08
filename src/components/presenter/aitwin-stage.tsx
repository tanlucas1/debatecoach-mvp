"use client";

import {
  AiTwin,
  EMOTION_TO_EYEBROW,
  type AiTwinHandle,
  type AvatarTtsLipsyncStatus,
} from "@streamoji/aitwin";
import { useRef } from "react";
import { isAiTwinFaceId } from "@/lib/presenter/aitwin-face";

// Debate replies read as angry or fearful to the mood tagger, which knits the brows hard.
// Keep a hint of each mood so the face stays calm while arguing.
Object.assign(EMOTION_TO_EYEBROW, { fear: -4, anger: -4, sad: -2, disgust: 2 });

export interface AiTwinStageProps {
  twinId: string;
  voiceId?: string;
  authToken: string;
  onReady: (handle: AiTwinHandle) => void;
  onStatusChange: (status: AvatarTtsLipsyncStatus) => void;
  onError: (message: string) => void;
}

export default function AiTwinStage({
  twinId,
  voiceId,
  authToken,
  onReady,
  onStatusChange,
  onError,
}: AiTwinStageProps) {
  const twinRef = useRef<AiTwinHandle>(null);
  const source = isAiTwinFaceId(twinId) ? { faceId: twinId } : { id: twinId };

  return (
    <AiTwin
      ref={twinRef}
      {...source}
      voiceId={voiceId}
      authToken={authToken}
      className="aspect-[3/4] h-full max-h-80 overflow-hidden rounded-card"
      showErrorOverlay={false}
      onReady={() => twinRef.current && onReady(twinRef.current)}
      onStatusChange={onStatusChange}
      onError={onError}
    />
  );
}
