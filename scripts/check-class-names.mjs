#!/usr/bin/env node
/**
 * Enforces the class-name law (DESIGN-RULES 7).
 *
 * Every authored HTML class token and every authored CSS class selector must
 * match ^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$. Tailwind utilities, BEM modifier
 * syntax, CSS Modules, and dynamic class construction fail the build.
 */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import process from "node:process";

const CLASS_TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

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

  // Dynamic construction hides the rendered token from this check.
  const dynamic = /className=\{(?![\s]*"[^"]*"[\s]*\})/g;
  for (const match of source.matchAll(dynamic)) {
    fail(
      file,
      lineOf(source, match.index),
      "className is constructed dynamically; use a static class plus a data attribute (DESIGN-RULES 7.6).",
    );
  }

  for (const match of source.matchAll(/className="([^"]*)"/g)) {
    const value = match[1];
    for (const token of value.split(/\s+/).filter(Boolean)) {
      if (!CLASS_TOKEN.test(token)) {
        fail(
          file,
          lineOf(source, match.index),
          `class token "${token}" does not match the class-name law.`,
        );
      }
    }
  }

  if (/from\s+["'][^"']*\.module\.css["']/.test(source)) {
    fail(file, 1, "CSS Modules are forbidden (DESIGN-RULES 7.5).");
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

function checkNoTailwindDependency() {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const all = {
    ...(manifest.dependencies ?? {}),
    ...(manifest.devDependencies ?? {}),
  };
  for (const name of Object.keys(all)) {
    if (/tailwind|styled-components|@emotion|@stitches/.test(name)) {
      fail(
        "package.json",
        1,
        `dependency "${name}" conflicts with the authored-CSS rule (CODEBASE-RULES 10).`,
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
  checkNoTailwindDependency();

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
