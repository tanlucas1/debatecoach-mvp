import type { Metadata } from "next";
import { DebateApp } from "@/components/debate/debate-app";
import { listCaseFileViews } from "@/lib/case-file";
import { getDefaultProviderId, listLlmProviders } from "@/lib/llm";
import { getPresenterConfig, getPresenterOptions } from "@/lib/presenter/config";
import { isSpeechConfigured } from "@/lib/speech/deepgram";
import { listAvailableVoices } from "@/lib/speech/synthesize";

export const metadata: Metadata = {
  title: "Practice",
};

export default async function PracticePage() {
  const caseFiles = await listCaseFileViews();
  return (
    <DebateApp
      caseFiles={caseFiles}
      providers={listLlmProviders()}
      defaultProvider={getDefaultProviderId()}
      speechEnabled={isSpeechConfigured()}
      voices={listAvailableVoices()}
      presenter={getPresenterConfig()}
      presenterOptions={getPresenterOptions()}
    />
  );
}
