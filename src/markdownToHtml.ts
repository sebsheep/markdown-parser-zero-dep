import type {
  MarkdownAST,
  MarkdownInlineAST,
  MarkdownListItemAST,
} from "./parser.ts";

export const markdownASTToHtml = (markdown: MarkdownAST): string =>
  markdown.blocks
    .map((block): string => {
      switch (block.kind) {
        case "paragraph":
          return `<p>${block.content.map(inlineMarkdownToHtml).join("")}</p>`;
        case "header":
          return `<h${block.level}>${block.content.map(inlineMarkdownToHtml).join("")}</h${block.level}>`;
        case "list":
          return `<ul>${block.items.map(listItemToHtml).join("")}</ul>`;
        case "horizontal-line":
          return "<hr>";
      }
    })
    .join("");

const listItemToHtml = (item: MarkdownListItemAST): string =>
  `<li>${[
    ...item.content.map(inlineMarkdownToHtml),
    item.sublist ?
      `<ul>${item.sublist.items.map(listItemToHtml).join("")}</ul>`
    : "",
  ].join("")}</li>`;

const inlineMarkdownToHtml = (inline: MarkdownInlineAST): string => {
  switch (inline.kind) {
    case "normalString":
      return escapeHtml(inline.value).replaceAll("\n", "<br>");
    case "bold":
      return `<b>${inline.value.map(inlineMarkdownToHtml).join("")}</b>`;
    case "italic":
      return `<i>${inline.value.map(inlineMarkdownToHtml).join("")}</i>`;
    case "link":
      return `<a href="${escapeHtml(inline.url)}">${inline.value.map(inlineMarkdownToHtml).join("")}</a>`;
    case "formattedCode":
      return `<code>${escapeHtml(inline.value)}</code>`;
  }
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("’", "&#8217;")
    .replaceAll("‑", "&#8209;")
    .replaceAll("“", "&ldquo;")
    .replaceAll("”", "&rdquo;");
