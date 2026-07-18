import { lexifyMarkdown, parseMarkdown } from "../src/parser.ts";
import { runTests, type Snapshot } from "./snapshot-testing.ts";

const testMarkdown = (input: string) => {
  const { result, errors } = parseMarkdown(input);
  return (
    JSON.stringify(result, null, 2)
    + (errors.length > 0 ?
      "\nErrors:\n" + JSON.stringify(errors, null, 2)
    : "")
  );
};

const testLexify = (input: string) =>
  JSON.stringify(lexifyMarkdown(input), null, 2);

const tests: Snapshot[] = [
  { name: "simple-text", input: () => testMarkdown("Hello world") },
  { name: "bold-text", input: () => testMarkdown("Hello **bold** world") },
  {
    name: "links",
    input: () => testMarkdown("Here is a [link](https://example.com)"),
  },
  {
    name: "bold-in-links",
    input: () => testMarkdown("Here is a [**link**](https://example.com)"),
  },
  {
    name: "bold-in-italic",
    input: () =>
      testMarkdown("Hello ** *italic and bold* but only bold** text"),
  },
  { name: "italic-with_", input: () => testMarkdown("Hello _italic_ world") },
  { name: "not-finished-bold", input: () => testMarkdown("Hello **bold") },
  { name: "not-finished-italic", input: () => testMarkdown("Hello *italic") },
  {
    name: "not-finished-bold-italic",
    input: () => testMarkdown("Hello ** *italic and bold"),
  },
  {
    name: "not-finished-bold-italic-2",
    input: () => testMarkdown("Hello ** *italic* and bold"),
  },
  {
    name: "not-finished-bold-italic-3",
    input: () => testMarkdown("Hello ** *italic and bold**"),
  },
  {
    name: "not-finished-bold-italic-4",
    input: () => testMarkdown("**before _italic and bold** after_"),
  },
  { name: "blocks", input: () => testMarkdown("Hello\n\nWorld") },
  {
    name: "underscore-in-url",
    input: () => testMarkdown("[link](https://example_.com)"),
  },
  { name: "incomplete-link", input: () => testMarkdown("[link](blabla") },
  {
    name: "bracket-no-link",
    input: () => testMarkdown("[_not a link_]blabla"),
  },
  { name: "lexify-bold", input: () => testLexify("Hello **bold** world") },
  {
    name: "lexify-list",
    input: () => testLexify("- List item 1\n- List item 2"),
  },
  {
    name: "lexify-list-2",
    input: () => testLexify("- List item 1\n  - List item 2"),
  },
  { name: "lexify-non-list", input: () => testLexify("Hello - world") },
  {
    name: "parse-list",
    input: () => testMarkdown("- List item 1\n- List item 2"),
  },
  {
    name: "parse-wonky-indented-lists",
    input: () => testMarkdown("* a\n  * b\n * c"),
  },
  {
    name: "parse-text-list",
    input: () => testMarkdown("Hello\n- List item 1\n- List item 2"),
  },
  {
    name: "lexify-list-with-sublist",
    input: () =>
      testLexify(
        "- List item 1\n  - Sublist item 1\n  - Sublist item 2\n- List item 2",
      ),
  },
  {
    name: "parse-list-with-sublist",
    input: () =>
      testMarkdown(
        "- List item 1\n  - Sublist item 1\n  - Sublist item 2\n- List item 2",
      ),
  },
  { name: "parse-horizontal-line", input: () => testMarkdown("---") },
  { name: "parse-horizontal-line-2", input: () => testMarkdown("\n---\n") },
  {
    name: "parse-horizontal-line-in-text",
    input: () => testMarkdown("Hello---World"),
  },
  {
    name: "parse-horizontal-line-and-header",
    input: () => testMarkdown("   ---\n# 09/02"),
  },
  {
    name: "parse-list-decreasing-indentation",
    input: () => testMarkdown("  - List item 1\n - List item 2\n- List item 3"),
  },
  {
    name: "mixed",
    input: () =>
      testMarkdown(
        "- List *item* 2\n- **List** item 3\nHello\n\nWorld\n---\nGuten tag!",
      ),
  },

  {
    name: "lexify-numbered-list",
    input: () => testLexify("1. List item 1\n2. List item 2"),
  },
  {
    name: "parse-numbered-list",
    input: () => testMarkdown("1. List item 1\n2. List item 2"),
  },
  {
    name: "parse-numbered-list-with-sublist",
    input: () =>
      testMarkdown(
        "1. List item 1\n  5. Sublist item 1\n  1. Sublist item 2\n2. List item 2",
      ),
  },
  {
    name: "parse-numbered-list-with-non-numberedsublist",
    input: () =>
      testMarkdown(
        "1. List item 1\n  - Sublist item 1\n  - Sublist item 2\n2. List item 2",
      ),
  },
  { name: "lexify-header", input: () => testLexify("## Title\nSalut") },
  { name: "parse-header", input: () => testMarkdown("## Title\nSalut") },
  {
    name: "parse-star-paragraph-dont-loop-forever",
    input: () => testMarkdown("*\n\n"),
  },
  {
    name: "parse-newline-header-dont-loop-forever",
    input: () => testMarkdown("\n# "),
  },
  {
    name: "parse-orphan-closing-bracket-dont-loop-forever",
    input: () => testMarkdown("]"),
  },
  {
    name: "parse-multinewline-makes-paragraph",
    input: () => testMarkdown("Bla\n\n\nbla"),
  },
  {
    name: "parse-parenthesis-dont-loop-forever",
    input: () => testMarkdown("text (text2)"),
  },
  {
    name: "parse-paragraph-break-inside-link-dont-loop-forever",
    input: () => testMarkdown("[\n\n"),
  },
  {
    name: "parse-header-inside-bold-dont-loop-forever",
    input: () => testMarkdown("** \n# "),
  },
  {
    name: "parse-link-inside-header-dont-loop-forever",
    input: () => testMarkdown("# [\n"),
  },
  {
    name: "parse-header-after-list-dont-loop-forever",
    input: () => testMarkdown("\n* \n# "),
  },
  {
    name: "parse-header-inside-formatted-code-and-list-dont-loop-forever",
    input: () => testMarkdown("* `\n# `\n "),
  },
  { name: "parse-code", input: () => testMarkdown("`code`") },
  {
    name: "parse-code-mixed",
    input: () => testMarkdown("# Hello `code` world\n* `co**de**` *blabla*"),
  },
  {
    name: "parse-link-with-backtick-dont-loop-forever",
    input: () => testMarkdown("[link](`)`"),
  },
  {
    name: "parse-horizontal-line-in-list-dont-loop-forever",
    input: () => testMarkdown("* \n---\n"),
  },
];

await runTests(tests, "tests/snapshots");
