import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src");
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
walk(root);
const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const checks = [
  [!source.includes('lang="en"'), "No English document language declarations"],
  [!source.includes("8:00 PM") && !source.includes("8 PM"), "Meeting time is consistently 7 PM"],
  [
    !source.includes("4582988008") && !source.includes("298-8008"),
    "Legacy English phone number is absent",
  ],
  [!source.includes('href="#"'), "No dead hash-only links"],
  [!source.includes("matt-brown.png.asset.json"), "No Lovable-only production image reference"],
  [fs.existsSync("src/routes/robots[.]txt.ts"), "robots.txt route exists"],
  [fs.existsSync("src/routes/evaluaciones.tsx"), "Spanish evaluation page exists"],
  [
    fs.readFileSync("src/routes/sitemap[.]xml.ts", "utf8").includes("https://ayudasobria.com"),
    "Sitemap uses absolute production URLs",
  ],
  [
    fs.readFileSync("src/routes/api.registro.ts", "utf8").includes("TURNSTILE_SECRET_KEY") &&
      fs.readFileSync("src/routes/api.registro.ts", "utf8").includes("MAX_BODY_BYTES"),
    "Registration endpoint has Turnstile verification and a body-size limit",
  ],
  [
    fs.readFileSync("src/routes/registro.tsx", "utf8").includes("cf-turnstile") &&
      fs.readFileSync("src/routes/registro.tsx", "utf8").includes('name="website"'),
    "Registration form includes Turnstile and honeypot controls",
  ],
];
let failed = false;
for (const [ok, label] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
