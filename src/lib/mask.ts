/** Hides most of a phone number or email so a list can show who it is without showing how to reach them. Pure, so server and client agree. */
export function maskPhone(phone?: string): string {
  const d = (phone ?? "").replace(/[^\d+]/g, "");
  if (d.length < 7) return d ? "•••" : "";
  return `${d.slice(0, d.startsWith("+") ? 5 : 3)} ••• ${d.slice(-3)}`;
}

export function maskEmail(email?: string): string {
  const [name, host] = (email ?? "").split("@");
  if (!name || !host) return "";
  return `${name.slice(0, 1)}•••@${host}`;
}
