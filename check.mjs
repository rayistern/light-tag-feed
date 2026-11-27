#!/usr/bin/env node
// Says whether parties.json may be served. The same rules as the web app's
// checkFeed (merkos-302/onemitzvah frontend/src/hunt/parties.ts); keep in step.
import { readFileSync } from "node:fs";

const KINDS = ["menorah", "dreidel", "gelt", "donut"];
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const timeMs = (v) => (typeof v === "string" && TIME.test(v) ? Date.parse(v) : NaN);

function isHttpsLink(value) {
  if (typeof value !== "string" || !/^https:\/\//i.test(value) || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".") && !url.username && !url.password;
  } catch {
    return false;
  }
}

function checkParty(p) {
  if (!isRecord(p)) return ["is not an object"];
  const wrong = [];
  if (typeof p.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(p.id)) wrong.push("id must be 1-40 of a-z, 0-9 and -");
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 80) wrong.push("name must be 1-80 characters");
  if (typeof p.lat !== "number" || !Number.isFinite(p.lat) || Math.abs(p.lat) > 90) wrong.push("lat must be a number from -90 to 90");
  if (typeof p.lng !== "number" || !Number.isFinite(p.lng) || Math.abs(p.lng) > 180) wrong.push("lng must be a number from -180 to 180");
  const start = timeMs(p.starts_at);
  if (!Number.isFinite(start)) wrong.push("starts_at must be UTC like 2026-12-06T22:30:00Z");
  if (p.ends_at !== undefined) {
    const end = timeMs(p.ends_at);
    if (!Number.isFinite(end)) wrong.push("ends_at must be UTC like 2026-12-07T00:30:00Z");
    else if (Number.isFinite(start) && end <= start) wrong.push("ends_at must be after starts_at");
  }
  if (p.details !== undefined) {
    if (typeof p.details !== "string" || !p.details.trim() || p.details.length > 500) wrong.push("details must be 1-500 characters, or left out");
    else if (/[<>]/.test(p.details)) wrong.push("details must be plain text (no < or >)");
  }
  if (p.link !== undefined && !isHttpsLink(p.link)) wrong.push("link must be an https address, or left out");
  if (p.kind !== undefined && !KINDS.includes(p.kind)) wrong.push(`kind must be one of ${KINDS.join(", ")}, or left out`);
  if (p.scale !== undefined && !(typeof p.scale === "number" && p.scale >= 1 && p.scale <= 3)) wrong.push("scale must be a number from 1 to 3, or left out");
  return wrong;
}

export function checkFeed(body) {
  if (!isRecord(body)) return ["the feed is not an object"];
  const wrong = [];
  if (body.version !== 1) wrong.push("version must be 1");
  if (!Array.isArray(body.parties)) return [...wrong, "parties must be a list"];
  if (body.parties.length > 200) wrong.push("at most 200 parties");
  const seen = new Set();
  body.parties.forEach((p, i) => {
    const label = isRecord(p) && typeof p.id === "string" ? `party ${i} (${p.id})` : `party ${i}`;
    for (const problem of checkParty(p)) wrong.push(`${label}: ${problem}`);
    if (isRecord(p)) {
      if (seen.has(p.id)) wrong.push(`${label}: id is used twice`);
      seen.add(p.id);
    }
  });
  return wrong;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2] ?? "parties.json";
  let wrong;
  try {
    wrong = checkFeed(JSON.parse(readFileSync(file, "utf8")));
  } catch (error) {
    wrong = [`${file} is not JSON: ${error.message}`];
  }
  for (const line of wrong) console.error(line);
  console.log(wrong.length ? `${file}: ${wrong.length} wrong. The phones may show no parties.` : `${file}: good.`);
  process.exit(wrong.length ? 1 : 0);
}
