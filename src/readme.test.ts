import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as api from "./index.js";

// Trailing comments declare an expected type, a runtime value, or "Compile error".
// Snippets can reuse earlier variable declarations, as the README's error examples do.
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const root = fileURLToPath(new URL("../", import.meta.url));
const previousDeclarations = new Map<string, string>();

function parse(text: string): ts.SourceFile {
  return ts.createSourceFile("example.ts", text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
}

function bindings(source: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) names.add(node.name.text);
    if (ts.isImportSpecifier(node)) names.add(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

function references(source: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      const isName =
        (ts.isVariableDeclaration(parent) && parent.name === node) ||
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isPropertySignature(parent) && parent.name === node) ||
        ts.isImportSpecifier(parent);
      if (!isName) names.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

function applyEdits(text: string, edits: Edit[]): string {
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }
  return text;
}

function prepareExample(raw: string, index: number) {
  // Commented-out compile-error examples must also continue to be rejected.
  const code = raw.replace(/^(\s*)\/\/ (.+;\s*\/\/ Compile error.*)$/gm, "$1$2");
  const source = parse(code);
  const declared = bindings(source);
  const setup = new Set<string>();
  const resolving = new Set<string>();
  const addDependency = (name: string): void => {
    if (declared.has(name) || resolving.has(name)) return;
    const declaration = previousDeclarations.get(name);
    if (!declaration || setup.has(declaration)) return;
    resolving.add(name);
    for (const dependency of references(parse(declaration))) addDependency(dependency);
    setup.add(declaration);
  };
  for (const name of references(source)) addDependency(name);

  const imports = Object.keys(api)
    .filter((name) => !declared.has(name))
    .join(", ");
  const preamble = `import { ${imports} } from './index.js';
import { expect as __expect } from 'vitest';
type __Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type __Assert<T extends true> = T;
${[...setup].join("\n")}\n`;
  const compileEdits: Edit[] = [];
  const runtimeEdits: Edit[] = [];
  let assertions = 0;
  let intentionalErrors = 0;

  const visit = (node: ts.Node): void => {
    if (ts.isExpressionStatement(node) || ts.isVariableStatement(node)) {
      const comments = ts.getTrailingCommentRanges(code, node.end) ?? [];
      const annotation = comments
        .map((comment) => code.slice(comment.pos, comment.end))
        .find((comment) => comment.startsWith("//"))
        ?.slice(2)
        .trim();
      if (annotation?.startsWith("Compile error")) {
        compileEdits.push({
          start: node.getStart(source),
          end: node.getStart(source),
          text: "// @ts-expect-error Intentional README error\n",
        });
        runtimeEdits.push({ start: node.getStart(source), end: node.end, text: "" });
        intentionalErrors++;
        return;
      }
      if (annotation) {
        const name = `__result${assertions}`;
        let target: string;
        if (ts.isExpressionStatement(node)) {
          const expression = node.expression.getText(source);
          const replacement = { start: node.getStart(source), end: node.end, text: `const ${name} = ${expression};` };
          compileEdits.push(replacement);
          runtimeEdits.push(replacement);
          target = name;
        } else {
          const declaration = node.declarationList.declarations[0];
          if (!declaration || !ts.isIdentifier(declaration.name))
            throw new Error("Use a single named variable for annotated README examples");
          target = declaration.name.text;
        }
        const mutation = /^(true|false);\s+(.+?) becomes (.+)$/.exec(annotation);
        const expected = mutation?.[1] ?? annotation;
        const isValue = /^(true|false|null|undefined|-?\d+(?:\.\d+)?|'.*'|".*"|\[.*\])$/.test(expected);
        if (isValue) {
          const assertion =
            `\n__expect(${target}).toEqual(${expected});` +
            (mutation ? `\n__expect(${mutation[2]}).toEqual(${mutation[3]});` : "");
          compileEdits.push({ start: node.end, end: node.end, text: assertion });
          runtimeEdits.push({ start: node.end, end: node.end, text: assertion });
        } else {
          // Let TypeScript compare the inferred type with the README's type comment.
          compileEdits.push({
            start: node.end,
            end: node.end,
            text: `\ntype __Check${assertions} = __Assert<__Equal<typeof ${target}, ${expected}>>;`,
          });
        }
        assertions++;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) previousDeclarations.set(declaration.name.text, statement.getText(source));
    }
  }
  const rewriteImports = (text: string) => text.replace(/(['"])@fimbul-works\/nested-path\1/g, "'./index.js'");
  return {
    filename: fileURLToPath(
      new URL(
        `./__readme_${index}_line_${readme.slice(0, readme.indexOf(raw)).split("\n").length}.ts`,
        import.meta.url,
      ),
    ),
    line: readme.slice(0, readme.indexOf(raw)).split("\n").length,
    compile: preamble + rewriteImports(applyEdits(code, compileEdits)),
    runtime: preamble + rewriteImports(applyEdits(code, runtimeEdits)),
    assertions,
    intentionalErrors,
  };
}

const examples = [...readme.matchAll(/^```(?:ts|typescript)\s*\r?\n([\s\S]*?)^```\s*$/gm)].map((match, index) =>
  prepareExample(match[1]!, index),
);

describe("README TypeScript examples", () => {
  it("typechecks every example, its inferred-type comments, and its intentional errors", () => {
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.reduce((count, example) => count + example.assertions, 0)).toBeGreaterThan(0);
    expect(examples.reduce((count, example) => count + example.intentionalErrors, 0)).toBeGreaterThan(0);
    const files = new Map(examples.map((example) => [example.filename, example.compile]));
    const options: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      types: ["node"],
    };
    const host = ts.createCompilerHost(options);
    const originalGetSourceFile = host.getSourceFile.bind(host);
    const originalFileExists = host.fileExists.bind(host);
    host.fileExists = (filename) => files.has(filename) || originalFileExists(filename);
    host.getSourceFile = (filename, version, onError, createNew) => {
      const content = files.get(filename);
      return content === undefined
        ? originalGetSourceFile(filename, version, onError, createNew)
        : ts.createSourceFile(filename, content, version, true);
    };
    const program = ts.createProgram([...files.keys()], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const report = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (filename) => filename,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    });
    expect(diagnostics, report).toHaveLength(0);
  });

  it.each(examples)("runs the example at README line $line and checks its value comments", (example) => {
    const hooks: Array<() => unknown> = [];
    const compiled = ts.transpileModule(example.runtime, {
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS },
    });
    const load = (name: string): unknown => {
      if (name === "./index.js") return api;
      if (name === "vitest") return { expect, afterEach: (callback: () => unknown) => hooks.push(callback) };
      throw new Error(`Unconfigured README import: ${name}`);
    };
    try {
      // Execute the checked-in examples, with imports bound to the actual public API.
      const execute = new Function("require", "exports", compiled.outputText);
      execute(load, {});
      for (const hook of hooks) hook();
    } finally {
      api.clearPathSeparators();
    }
  });
});
