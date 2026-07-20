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
const sitemapSource = fs.readFileSync("src/routes/sitemap[.]xml.ts", "utf8");
const rootSource = fs.readFileSync("src/routes/__root.tsx", "utf8");
const homeSource = fs.readFileSync("src/routes/index.tsx", "utf8");
const membershipSource = fs.readFileSync("src/routes/membresia.index.tsx", "utf8");
const registrationSource = fs.readFileSync("src/routes/registro.tsx", "utf8");
const layoutRoutes = [
  "apoyo-familiar.tsx",
  "apoyo-familiar.$state.tsx",
  "blog.tsx",
  "coaching-pago.tsx",
  "herramientas-ia.tsx",
  "mapa.tsx",
  "membresia.tsx",
  "paises.tsx",
  "recursos.tsx",
  "respuestas-familia.tsx",
];
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
  [sitemapSource.includes("https://ayudasobria.com"), "Sitemap uses absolute production URLs"],
  [!/rel:\s*"canonical",\s*href:\s*[`"]\//.test(source), "Canonical URLs are absolute"],
  [
    layoutRoutes.every((file) =>
      fs.readFileSync(path.join("src/routes", file), "utf8").includes("Outlet"),
    ),
    "Nested route parents render an Outlet",
  ],
  [
    !sitemapSource.includes('"/ingresar"') &&
      !sitemapSource.includes('"/registro"') &&
      !sitemapSource.includes("s.cities"),
    "Sitemap excludes utility and thin city routes",
  ],
  [
    rootSource.includes("https://ayudasobria.com/og-ayudasobria.png") &&
      rootSource.includes('property: "og:image:width"') &&
      rootSource.includes('property: "og:image:height"'),
    "Social image is first-party and dimensioned",
  ],
  [source.includes('"@type": "BlogPosting"'), "Blog posts include structured data"],
  [
    !source.includes("Directorio en español") &&
      !source.includes("directorio de tratamiento") &&
      !fs
        .readFileSync("src/components/site/SiteLayout.tsx", "utf8")
        .includes('to="/proveedores"') &&
      !sitemapSource.includes('"/proveedores"'),
    "Spanish site does not advertise or globally link a copied provider directory",
  ],
  [
    fs.readFileSync("src/routes/api.registro.ts", "utf8").includes("TURNSTILE_SECRET_KEY") &&
      fs.readFileSync("src/routes/api.registro.ts", "utf8").includes("MAX_BODY_BYTES"),
    "Registration endpoint has Turnstile verification and a body-size limit",
  ],
  [
    registrationSource.includes("cf-turnstile") && registrationSource.includes('name="website"'),
    "Registration form includes Turnstile and honeypot controls",
  ],
  [
    !membershipSource.includes("Biblioteca completa de educación familiar") &&
      !membershipSource.includes("Foro privado para miembros") &&
      !homeSource.includes("Un foro privado de familias") &&
      !membershipSource.toLowerCase().includes("prueba gratis") &&
      !registrationSource.includes("recordatorio 24 horas antes"),
    "Sales and registration copy only promises currently implemented fulfillment",
  ],
];
let failed = false;
for (const [ok, label] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
