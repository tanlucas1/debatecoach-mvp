import { COLOR_MODES, COLOR_SCHEMES, THEME_STORAGE_KEY } from "./config";

const schemeIds = COLOR_SCHEMES.map(({ id }) => id);

export const themeInitScript = `(function () {
  var root = document.documentElement;
  var schemes = ${JSON.stringify(schemeIds)};
  var modes = ${JSON.stringify(COLOR_MODES)};
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})); } catch (e) {}
  if (saved && schemes.indexOf(saved.scheme) > -1) root.dataset.scheme = saved.scheme;
  if (saved && modes.indexOf(saved.mode) > -1) root.dataset.mode = saved.mode;
  else if (window.matchMedia("(prefers-color-scheme: light)").matches) root.dataset.mode = "light";
})();`;
