import crypto from "node:crypto";

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableSerialize(v)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableSerialize(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function stableStringify(value) {
  return stableSerialize(value);
}

export function sha256Hex(value) {
  const input = typeof value === "string" ? value : stableSerialize(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}
