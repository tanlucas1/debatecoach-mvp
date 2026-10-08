import { describe, expect, it } from "vitest";
import { isSameSite } from "./same-site";

describe("isSameSite", () => {
  it("trusts the browser's own marker", () => {
    expect(isSameSite(new Headers({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameSite(new Headers({ "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameSite(new Headers({ "sec-fetch-site": "none" }))).toBe(false);
  });

  it("falls back to comparing the origin with the host", () => {
    expect(isSameSite(new Headers({ origin: "https://app.example", host: "app.example" }))).toBe(
      true,
    );
    expect(isSameSite(new Headers({ origin: "https://other.example", host: "app.example" }))).toBe(
      false,
    );
  });

  it("rejects requests that say nothing about where they came from", () => {
    expect(isSameSite(new Headers({ host: "app.example" }))).toBe(false);
  });
});
