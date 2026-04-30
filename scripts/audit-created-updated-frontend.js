const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();

const FRONTEND_ROOTS = [
  "app",
  "src",
  "components",
  "context",
  "redux",
  "screens",
  "hooks",
  "utils",
].filter((folder) => fs.existsSync(path.join(PROJECT_ROOT, folder)));

const INCLUDE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".expo",
  ".firebase",
  "android",
  "ios",
  "dist",
  "build",
  "coverage",
  "scripts",
  "functions",
]);

const SEARCH_PATTERNS = [
  { label: "created", regex: /created/i },
  { label: "updated", regex: /updated/i },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    if (IGNORE_DIRS.has(entry.name)) return;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
      return;
    }

    const ext = path.extname(entry.name);

    if (INCLUDE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  });

  return files;
}

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);

  const hits = [];

  lines.forEach((line, index) => {
    SEARCH_PATTERNS.forEach((pattern) => {
      pattern.regex.lastIndex = 0;

      if (pattern.regex.test(line)) {
        hits.push({
          filePath,
          lineNumber: index + 1,
          label: pattern.label,
          line: line.trim(),
        });
      }
    });
  });

  return hits;
}

function main() {
  console.log("🔎 iREPS frontend created/updated audit");
  console.log("Project root:", PROJECT_ROOT);
  console.log("Scanning folders:", FRONTEND_ROOTS.join(", "));
  console.log("");

  const files = [];

  FRONTEND_ROOTS.forEach((folder) => {
    walk(path.join(PROJECT_ROOT, folder), files);
  });

  const findings = [];

  files.forEach((filePath) => {
    findings.push(...scanFile(filePath));
  });

  const byFile = new Map();

  findings.forEach((hit) => {
    if (!byFile.has(hit.filePath)) {
      byFile.set(hit.filePath, []);
    }

    byFile.get(hit.filePath).push(hit);
  });

  const report = [];

  report.push("# iREPS Frontend Created / Updated Audit");
  report.push("");
  report.push(`Project root: ${PROJECT_ROOT}`);
  report.push(`Files scanned: ${files.length}`);
  report.push(`Findings: ${findings.length}`);
  report.push("");

  for (const [filePath, hits] of byFile.entries()) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    report.push("---");
    report.push("");
    report.push(`## ${relativePath}`);
    report.push("");

    hits.forEach((hit) => {
      report.push(`Line ${hit.lineNumber} [${hit.label}]`);
      report.push("");
      report.push("```js");
      report.push(hit.line);
      report.push("```");
      report.push("");
    });
  }

  const reportPath = path.join(
    PROJECT_ROOT,
    "frontend-created-updated-audit.md",
  );

  fs.writeFileSync(reportPath, report.join("\n"), "utf8");

  console.log(`✅ Audit complete`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Findings: ${findings.length}`);
  console.log(`Report created: ${reportPath}`);
}

main();
