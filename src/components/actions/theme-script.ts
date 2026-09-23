/**
 * The theme bootstrap, as a string, because it has to run before paint.
 *
 * Without it the server's `data-theme="light"` stands until React hydrates and
 * ThemeToggle's effect reads storage — so a reader who chose dark watched the
 * page flash white and then turn over. Nothing React does can fix that: an
 * effect runs after the first paint by definition.
 *
 * This runs synchronously while the document is still parsing, before the body
 * below it is painted, so the first frame is already the chosen theme.
 *
 * It is deliberately tiny and total: any failure leaves the server's value in
 * place, which is a readable page in the default theme.
 */

/** Shared with ThemeToggle, which reads and writes the same key. */
export const THEME_STORAGE_KEY = "proofpulse-theme";

export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;
