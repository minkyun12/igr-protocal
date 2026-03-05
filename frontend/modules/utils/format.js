export function spreadOf(c) {
  const a = c?.model_outputs?.first_run?.adjudicatorA?.confidence ?? 0;
  const b = c?.model_outputs?.first_run?.adjudicatorB?.confidence ?? 0;
  return Math.abs(a - b);
}

export function isMismatch(c) {
  return c?.settlement?.branch_code === "FINAL_MISMATCH";
}

export function stateClass(c) {
  return isMismatch(c) ? "mismatch" : "match";
}

export function shortQ(text, max = 74) {
  if (typeof text !== "string") return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
