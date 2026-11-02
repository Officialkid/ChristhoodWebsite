export const phoneOk = (v: string) => /^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;

/** 07XX and 7XX become +254 so every number is written the same way. */
export const normalisePhone = (v: string) => {
  const d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("0")) return `+254${d.slice(1)}`;
  if (d.startsWith("254")) return `+${d}`;
  return d;
};
