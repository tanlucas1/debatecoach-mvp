/** Custom faces built from a photo are addressed by a 64-character hex id, sample twins by a slug. */
export const isAiTwinFaceId = (twinId: string) => /^[0-9a-f]{64}$/.test(twinId);
