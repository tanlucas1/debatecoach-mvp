export class AvatarNotConfiguredError extends Error {
  constructor() {
    super("The avatar is not configured.");
    this.name = "AvatarNotConfiguredError";
  }
}

export class AvatarServiceError extends Error {
  constructor(provider: string, status: number) {
    super(`${provider} request failed with status ${status}.`);
    this.name = "AvatarServiceError";
  }
}
