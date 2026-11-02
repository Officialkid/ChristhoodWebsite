/** "Jewels Kids Camp 2026" becomes "Jewels Kids": short enough for a table cell or a search result. */
export const shortCamp = (title: string) => title.replace(/\s*Camp(\s+20\d\d)?$/i, "").trim() || title;
