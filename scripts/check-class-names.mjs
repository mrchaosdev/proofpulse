#!/usr/bin/env node
/**
 * Enforces the class-name law (DESIGN-RULES 7).
 *
 * Two vocabularies now share the codebase. Tailwind utilities are permitted
 * (7a) and are recognised and skipped. Everything this project names itself
 * (7b) must still match ^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$, so BEM modifiers,
 * CSS Modules and dynamic class construction still fail the build.
 *
 * A Tailwind utility carrying an arbitrary value fails too when that value
 * looks like a colour: colour law 7 keeps literals inside tokens.css, and
 * bg-[#ff0000] would put one in a component.
 */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import process from "node:process";

const CLASS_TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** Arbitrary values that put a colour literal outside the token stylesheet. */
const ARBITRARY_COLOUR = /\[(?:#|rgb|hsl|oklch|color\()/i;

/**
 * Characters that only appear in Tailwind's vocabulary: variant colons,
 * arbitrary values and variants in brackets, the parentheses of a custom
 * property shorthand, opacity slashes, container queries, the child selector,
 * the ampersand of an arbitrary variant, and the decimal point of a half-step
 * size.
 */
const UTILITY_SYNTAX = /[:[\]/@*&.()]/;

/**
 * Decides which vocabulary a token belongs to.
 *
 * Tailwind's real grammar is far larger than it looks — `@container/name`,
 * `*:data-[slot=x]:flex`, `[&_svg:not([class*='size-'])]:size-4` are all
 * valid — so rather than parsing it, anything that is not a well-formed
 * authored class is treated as a utility, with the shapes that could only ever
 * be a mistake rejected first.
 */
function classify(token) {
  if (CLASS_TOKEN.test(token)) return "authored";
  // PascalCase is a component name, never a class.
  if (/^[A-Z]/.test(token)) return "invalid";
  /*
   * BEM syntax — but not inside an arbitrary value, where `_` is Tailwind's
   * space, nor inside a custom-property shorthand, where `--` opens the
   * variable name: max-h-(--radix-select-content-available-height).
   */
  const carriesValue = token.includes("[") || token.includes("(");
  if (!carriesValue && (token.includes("_") || token.includes("--"))) {
    return "invalid";
  }
  // A leading hyphen is Tailwind's negative utility, as in -mx-1.
  if (token.startsWith("-")) return "utility";
  return UTILITY_SYNTAX.test(token) ? "utility" : "invalid";
}

const MARKUP_GLOBS = ["src/**/*.tsx", "src/**/*.ts"];
const STYLE_GLOBS = ["src/**/*.css"];

const failures = [];

function fail(file, line, message) {
  failures.push({ file, line, message });
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

function checkMarkup(file) {
  const source = readFileSync(file, "utf8");

  /*
   * Construction from a value still hides the rendered token, so a template
   * literal with an interpolation inside className fails. Composition does
   * not: cn("bg-primary", className) leaves every token readable in the
   * source, which is the point of the rule, and every shadcn/ui component is
   * written that way.
   */
  for (const match of source.matchAll(/className=\{([^}]*)\}/g)) {
    if (/`[^`]*\$\{/.test(match[1] ?? "")) {
      fail(
        file,
        lineOf(source, match.index),
        "className is built from a value; use a static class plus a data attribute (DESIGN-RULES 7b.4).",
      );
    }
  }

  // Tokens from both forms: className="..." and any literal inside className={}.
  const strings = [];
  for (const match of source.matchAll(/className="([^"]*)"/g)) {
    strings.push({ value: match[1] ?? "", index: match.index });
  }
  for (const match of source.matchAll(/className=\{([^}]*)\}/g)) {
    for (const literal of (match[1] ?? "").matchAll(/"([^"]*)"/g)) {
      strings.push({ value: literal[1] ?? "", index: match.index });
    }
  }

  for (const { value, index } of strings) {
    for (const token of value.split(/\s+/).filter(Boolean)) {
      const kind = classify(token);

      if (kind === "invalid") {
        fail(
          file,
          lineOf(source, index),
          `class token "${token}" does not match the class-name law (DESIGN-RULES 7b).`,
        );
        continue;
      }

      if (kind === "utility" && ARBITRARY_COLOUR.test(token)) {
        fail(
          file,
          lineOf(source, index),
          `utility "${token}" carries a colour literal; colours live in tokens.css (DESIGN-RULES 7a.1).`,
        );
      }
    }
  }

  if (/from\s+["'][^"']*\.module\.css["']/.test(source)) {
    fail(file, 1, "CSS Modules are forbidden (DESIGN-RULES 7b.3).");
  }
}

function checkStyles(file) {
  const source = readFileSync(file, "utf8");
  // Class selectors only. Custom properties, pseudo-classes, and element or
  // attribute selectors are outside the class-token contract.
  for (const match of source.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) {
    const token = match[1];
    if (!CLASS_TOKEN.test(token)) {
      fail(
        file,
        lineOf(source, match.index),
        `CSS class selector ".${token}" does not match the class-name law.`,
      );
    }
  }
  // !important is allowed only with a comment on the same line explaining the
  // exception (DESIGN-RULES 8).
  source.split("\n").forEach((line, index) => {
    if (line.includes("!important") && !line.includes("/*")) {
      fail(
        file,
        index + 1,
        "!important requires an adjacent comment explaining the exception (DESIGN-RULES 8).",
      );
    }
  });
}

/**
 * Tailwind is now a dependency, as the base of shadcn/ui (D-072). Runtime
 * styling libraries are still banned: CSS-in-JS moves styling into JavaScript,
 * which is what CODEBASE-RULES 10 exists to prevent, and Tailwind does not.
 */
function checkNoRuntimeStyling() {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const all = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  };
  for (const name of Object.keys(all)) {
    if (/styled-components|@emotion|@stitches|jss|aphrodite/.test(name)) {
      fail(
        "package.json",
        1,
        `dependency "${name}" puts styling in JavaScript (CODEBASE-RULES 10).`,
      );
    }
  }
}

function run() {
  for (const pattern of MARKUP_GLOBS) {
    for (const file of globSync(pattern)) checkMarkup(file);
  }
  for (const pattern of STYLE_GLOBS) {
    for (const file of globSync(pattern)) checkStyles(file);
  }
  checkNoRuntimeStyling();

  if (failures.length === 0) {
    console.log("check-class-names: pass");
    return;
  }
  for (const failure of failures) {
    console.error(`${failure.file}:${failure.line} ${failure.message}`);
  }
  console.error(`check-class-names: ${failures.length} violation(s)`);
  process.exit(1);
}

run();
