// Builds data/words/answers.tsv and data/words/valid.txt from public word lists.
// Usage: node tools/wordlists/build-wordlists.mjs
// Requires: internet access, system `tar`. Output is committed, so this rarely needs re-running.
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;
const RAW = join(ROOT, "data/raw");
const OUT = join(ROOT, "data/words");
const SCOWL = "scowl-2020.12.07";

const SOURCES = {
  enable: "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt",
  scowl: `https://downloads.sourceforge.net/wordlist/${SCOWL}.tar.gz`,
  blocklist:
    "https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en",
};

mkdirSync(RAW, { recursive: true });
mkdirSync(OUT, { recursive: true });

async function download(url, dest) {
  if (existsSync(dest)) return;
  console.log("downloading", url);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

await download(SOURCES.enable, join(RAW, "enable1.txt"));
await download(SOURCES.blocklist, join(RAW, "blocklist.txt"));
await download(SOURCES.scowl, join(RAW, `${SCOWL}.tar.gz`));
if (!existsSync(join(RAW, SCOWL))) {
  execSync(`tar xzf ${SCOWL}.tar.gz`, { cwd: RAW });
}

const WORD = /^[a-z]{3,7}$/;
const lines = (file, enc = "utf8") =>
  readFileSync(file, enc).split(/\r?\n/).map((w) => w.trim());

const blocked = new Set(lines(join(RAW, "blocklist.txt")).map((w) => w.toLowerCase()));
const enable = new Set(lines(join(RAW, "enable1.txt")).filter((w) => WORD.test(w)));

function scowl(size) {
  const words = new Set();
  for (const variant of ["english", "american"]) {
    const file = join(RAW, SCOWL, "final", `${variant}-words.${size}`);
    for (const w of lines(file, "latin1")) if (WORD.test(w)) words.add(w);
  }
  return words;
}

// Tier = smallest SCOWL size containing the word (10 = most common).
const tierOf = new Map();
for (const size of [10, 20, 35]) {
  for (const w of scowl(size)) if (!tierOf.has(w)) tierOf.set(w, size);
}

const answers = [...tierOf.entries()]
  .filter(([w]) => enable.has(w) && !blocked.has(w))
  .sort(([a], [b]) => a.localeCompare(b));

const valid = new Set([...enable, ...scowl(40), ...scowl(50), ...tierOf.keys()]);
const validSorted = [...valid].filter((w) => !blocked.has(w)).sort();

writeFileSync(join(OUT, "answers.tsv"), answers.map(([w, t]) => `${w}\t${t}`).join("\n") + "\n");
writeFileSync(join(OUT, "valid.txt"), validSorted.join("\n") + "\n");
console.log(`answers.tsv: ${answers.length} words, valid.txt: ${validSorted.length} words`);
