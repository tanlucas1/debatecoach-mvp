// Browsers mark every request with where it came from. A request made by this app's own pages is
// "same-origin"; one from another site, or a script with no browser behind it, is not.
export function isSameSite(headers: Headers): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
