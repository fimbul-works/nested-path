import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const directory = fileURLToPath(new URL("../", import.meta.url));
const filename = fileURLToPath(new URL("../examples/__editor_probe__.ts", import.meta.url));
const imports = `import { getAtPath } from '../src/index.js';
import { createApplicationConfig } from './config-fixture.js';
const config = createApplicationConfig();\n`;

function inspectEditor(source: string, inspect: (service: ts.LanguageService) => void): void {
  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [filename],
    getScriptVersion: () => "1",
    getScriptSnapshot: (name) => {
      const content = name === filename ? source : ts.sys.readFile(name);
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => directory,
    getCompilationSettings: () => ({
      strict: true,
      skipLibCheck: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      types: ["node"],
    }),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  };
  const service = ts.createLanguageService(host);
  try {
    inspect(service);
  } finally {
    service.dispose();
  }
}

describe("TypeScript editor service with a realistic configuration", () => {
  it.each([
    ["", ");", ["db", "tenants", "db.primary", "telemetry.logging"]],
    ["db/", ', undefined, "/");', ["db/primary", "db/replicas", "db/pools"]],
  ])("suggests finite paths for %j", (path, suffix, expected) => {
    const prefix = `${imports}getAtPath(config, `;
    const source = prefix + JSON.stringify(path) + suffix;
    inspectEditor(source, (service) => {
      const result = service.getCompletionsAtPosition(filename, prefix.length + path.length + 1, {});
      const names = new Set(result?.entries.map((entry) => entry.name));
      for (const name of expected) expect(names.has(name), `Missing completion: ${name}`).toBe(true);
      expect(names.has("tenants.map")).toBe(false);
    });
  });

  it.each([
    ['"tenants.0.billing.invoices.0.items.0.sku"', "string | undefined"],
    ['"tenants.1.profile.address.city", "Unknown"', "string"],
    ['"telemetry.logging.levels.2"', '"warn"'],
    ['"db::primary::port", undefined, "::"', "number"],
  ])("reports the hover type for %s", (argumentsText, expected) => {
    const source = `${imports}const inferred = getAtPath(config, ${argumentsText});`;
    inspectEditor(source, (service) => {
      expect(service.getSemanticDiagnostics(filename)).toEqual([]);
      const hover = service.getQuickInfoAtPosition(filename, source.indexOf("inferred") + 1);
      expect(ts.displayPartsToString(hover?.displayParts)).toBe(`const inferred: ${expected}`);
    });
  });
});
