const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const inputHtmlPath = path.join(rootDir, "index.html");
const cssPath = path.join(rootDir, "dist", "styles.css");
const outputPath = path.join(rootDir, "dist", "index.single.html");

const MIME_BY_EXT = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function isLocalAssetRef(ref) {
  if (!ref) return false;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return false;
  if (ref.startsWith("data:")) return false;
  if (ref.startsWith("#")) return false;
  if (ref.startsWith("mailto:") || ref.startsWith("tel:")) return false;
  const clean = ref.split("?")[0].split("#")[0];
  const ext = path.extname(clean).toLowerCase();
  return Object.prototype.hasOwnProperty.call(MIME_BY_EXT, ext);
}

function toDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  const bytes = fs.readFileSync(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

if (!fs.existsSync(inputHtmlPath)) {
  throw new Error(`Arquivo não encontrado: ${inputHtmlPath}`);
}

if (!fs.existsSync(cssPath)) {
  throw new Error(`CSS não encontrado em ${cssPath}. Rode 'npm run build' antes.`);
}

let html = fs.readFileSync(inputHtmlPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

html = html.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']dist\/styles\.css["']\s*\/?>/i,
  `<style>${css}</style>`
);

html = html.replace(/\b(src|href)=["']([^"']+)["']/g, (full, attr, ref) => {
  if (!isLocalAssetRef(ref)) return full;
  const resolved = path.resolve(rootDir, ref);
  if (!resolved.startsWith(rootDir + path.sep) || !fs.existsSync(resolved)) {
    return full;
  }
  const dataUrl = toDataUrl(resolved);
  if (!dataUrl) return full;
  return `${attr}="${dataUrl}"`;
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, "utf8");

console.log(`Gerado: ${outputPath}`);
