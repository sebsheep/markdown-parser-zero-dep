export type MarkdownAST = { blocks: MarkdownBlockAST[] };

type MarkdownBlockAST =
  | { kind: "paragraph"; content: MarkdownInlineAST[] }
  | {
      kind: "list";
      items: MarkdownListItemAST[];
      numberingStartingFrom: number | null;
    }
  | { kind: "header"; content: MarkdownInlineAST[]; level: number }
  | { kind: "horizontal-line" };

export type MarkdownListItemAST = {
  content: MarkdownInlineAST[];
  sublist: {
    items: MarkdownListItemAST[];
    numberingStartingFrom: number | null;
  } | null;
};
export type MarkdownInlineAST =
  | { kind: "normalString"; value: string }
  | { kind: "bold"; value: MarkdownInlineAST[] }
  | { kind: "italic"; value: MarkdownInlineAST[] }
  | { kind: "link"; value: MarkdownInlineAST[]; url: string }
  | { kind: "formattedCode"; value: string };

export type Range = { start: number; end: number };

type Lexem =
  | { kind: LexemKindSimple; range: Range }
  | { kind: "list-marker"; range: Range; indent: number; number: number | null }
  | { kind: "header-start"; level: number; range: Range };

type LexemKindSimple =
  | "EOF"
  | "*"
  | "---"
  | "_"
  | "**"
  | "`"
  | "paragraph-break"
  | "["
  | "]"
  | "("
  | ")"
  | "text"
  | "header-end";

export const lexifyMarkdown = (text: string): Lexem[] => {
  const lexems: Lexem[] = [];
  let pos = 0;
  let lastTextStart = 0;
  let lastRowStart = 0;
  let lastRowEnd = 0;
  let rowKind: "NoContentYet" | "Header" | "Normal" = "NoContentYet";
  let numberOfDigits = 0;
  let headerLevel = 0;

  const finalizeText = (end: number) => {
    if (lastTextStart !== end) {
      lexems.push({ kind: "text", range: { start: lastTextStart, end } });
    }
  };

  const pushNonText = (start: number, kind: LexemKindSimple) => {
    finalizeText(start);
    lexems.push({ kind, range: { start, end: pos } });
    lastTextStart = pos;
  };

  const pushListMarker = (start: number) => {
    finalizeText(lastRowEnd);
    lexems.push({
      kind: "list-marker",
      range: { start, end: pos },
      indent: start - lastRowStart,
      number: null,
    });
    lastTextStart = pos;
  };
  const isNumberThenDot = () => {
    if (!isDigit(text[pos])) return false;
    numberOfDigits = 1;
    while (isDigit(text[pos + numberOfDigits])) numberOfDigits++;
    if (text[pos + numberOfDigits] !== ".") return false;
    if (text[pos + numberOfDigits + 1] !== " ") return false;
    return true;
  };
  const pushNumberedListMarker = (start: number) => {
    finalizeText(lastRowEnd);
    lexems.push({
      kind: "list-marker",
      range: { start, end: pos },
      indent: start - lastRowStart,
      // numberOfDigits should have been updated by isNumberThenDot
      number: parseInt(text.slice(start, start + numberOfDigits)),
    });
    lastTextStart = pos;
  };

  const isSharpsThenSpace = () => {
    if (text[pos] !== "#") return false;
    headerLevel = 1;
    while (text[pos + headerLevel] === "#") headerLevel++;
    if (text[pos + headerLevel] !== " ") return false;
    return true;
  };

  while (pos < text.length) {
    const char = text[pos];
    const start = pos;
    let lastCharIsNewline = false;
    if (
      rowKind === "NoContentYet"
      && (char === "*" || char === "-")
      && text[pos + 1] === " "
    ) {
      pos += 2;
      pushListMarker(start);
    } else if (rowKind === "NoContentYet" && isNumberThenDot()) {
      // numberOfDigits has been updated by isNumberThenDot
      pos += numberOfDigits + 2;
      pushNumberedListMarker(start);
    } else if (rowKind === "NoContentYet" && isSharpsThenSpace()) {
      // headerLevel has been updated by isSharpsThenSpace
      pos += headerLevel + 1;
      finalizeText(lastRowStart);
      lexems.push({
        kind: "header-start",
        range: { start, end: pos },
        level: headerLevel,
      });
      lastTextStart = pos;
      rowKind = "Header";
    } else if (char === "_") {
      pos += 1;
      pushNonText(start, "_");
    } else if (char === "`") {
      pos += 1;
      pushNonText(start, "`");
    } else if (
      rowKind === "NoContentYet"
      && char === "-"
      && text[pos + 1] === "-"
      && text[pos + 2] === "-"
      && (text.length <= pos + 3 || text[pos + 3] === "\n")
    ) {
      pos += 4;
      pushNonText(lastRowStart, "---");
      lastCharIsNewline = true;
    } else if (char === "*" && text[pos + 1] === "*") {
      pos += 2;
      pushNonText(start, "**");
    } else if (char === "*") {
      pos += 1;
      pushNonText(start, "*");
    } else if (char === "\n" && text[pos + 1] === "\n") {
      pos += 2;
      while (text[pos] === "\n") pos++;
      pushNonText(start, "paragraph-break");
      lastCharIsNewline = true;
    } else if (char === "[") {
      pos += 1;
      pushNonText(start, "[");
    } else if (char === "]") {
      pos += 1;
      pushNonText(start, "]");
    } else if (char === "(") {
      pos += 1;
      pushNonText(start, "(");
    } else if (char === ")") {
      pos += 1;
      pushNonText(start, ")");
    } else if (char === "\n" && rowKind === "Header") {
      pos += 1;
      pushNonText(start, "header-end");
      rowKind = "NoContentYet";
      lastCharIsNewline = true;
    } else {
      if (char === "\n") lastCharIsNewline = true;
      pos += 1;
    }

    if (lastCharIsNewline) {
      if (rowKind !== "NoContentYet") lastRowEnd = pos - 1;
      rowKind = "NoContentYet";
      lastRowStart = pos;
    } else if (char !== " " && rowKind === "NoContentYet") {
      rowKind = "Normal";
    }
  }
  finalizeText(pos);
  lexems.push({ kind: "EOF", range: { start: pos, end: pos } });
  return lexems;
};

const isDigit = (char: string) => char >= "0" && char <= "9";

class Iterator<Token> {
  private src: Token[];
  private offset: number;
  constructor(src: Token[]) {
    this.src = src;
    this.offset = 0;
  }
  next(): Token {
    const value = this.src[this.offset];
    if (this.offset < this.src.length - 1) this.offset++;
    return value;
  }
  peek(): Token {
    return this.src[this.offset];
  }
  getOffset(): number {
    return this.offset;
  }
  restoreOffset(offset: number) {
    this.offset = offset;
  }
}

export type MarkdownError =
  | { kind: "StylingTagNotClosed"; range: Range }
  | { kind: "LinkWithoutUrl"; range: Range }
  | { kind: "BracketNotClosed"; range: Range }
  | { kind: "ClosingBracketNotOpen"; range: Range }
  | {
      kind: "NotAlignedListMarkers";
      firstRange: Range;
      notAlignedRange: Range;
    };

const parse = (
  inputText: string,
  lexems: Iterator<Lexem>,
  errors: MarkdownError[],
): MarkdownBlockAST[] => {
  const blocks: MarkdownBlockAST[] = [];
  while (lexems.peek().kind !== "EOF") {
    const lexem = lexems.peek();
    if (lexem.kind === "list-marker") {
      const block = parseList(inputText, lexem, lexems, errors);
      blocks.push({
        kind: "list",
        items: block,
        numberingStartingFrom: lexem.number,
      });
    }
    if (lexem.kind === "header-start") {
      lexems.next();
      const content = parseAllInlineElements(inputText, lexems, errors);
      blocks.push({
        kind: "header",
        content: content ?? [],
        level: lexem.level,
      });
    } else if (lexem.kind === "---") {
      blocks.push({ kind: "horizontal-line" });
      lexems.next();
    } else {
      const content = parseAllInlineElements(inputText, lexems, errors);
      if (content) blocks.push({ kind: "paragraph", content });
    }
  }

  return blocks;
};

const parseAllInlineElements = (
  inputText: string,
  lexems: Iterator<Lexem>,
  errors: MarkdownError[],
): MarkdownInlineAST[] | null => {
  const content: MarkdownInlineAST[] = [];

  while (
    !isClosingLexem(lexems.peek())
    && lexems.peek().kind !== "header-start"
    && lexems.peek().kind !== "header-end"
  ) {
    const elements = parseInlineElements(inputText, lexems, errors);
    content.push(...elements);
  }

  // Consume paragraph break if present
  if (
    lexems.peek().kind === "paragraph-break"
    || lexems.peek().kind === "header-end"
  ) {
    lexems.next();
  }

  if (content.length === 0) return null;

  return content;
};

const isClosingLexem = (lexem: Lexem) =>
  lexem.kind === "paragraph-break"
  || lexem.kind === "list-marker"
  || lexem.kind === "header-start"
  || lexem.kind === "header-end"
  || lexem.kind === "---"
  || lexem.kind === "EOF";

const parseList = (
  inputText: string,
  firstLexem: Lexem & { kind: "list-marker" },
  lexems: Iterator<Lexem>,
  errors: MarkdownError[],
): MarkdownListItemAST[] => {
  const firstIndent = firstLexem.indent;

  const items: MarkdownListItemAST[] = [];
  while (
    lexems.peek().kind !== "EOF"
    && lexems.peek().kind !== "paragraph-break"
    && lexems.peek().kind !== "header-start"
    && lexems.peek().kind !== "---"
  ) {
    const nextLexem = lexems.peek();
    if (nextLexem.kind === "list-marker") {
      const nextIndent = nextLexem.indent;
      if (nextIndent < firstIndent) {
        return items;
      } else if (
        nextIndent > firstIndent
        && items.length > 0
        && items.at(-1)!.sublist === null
      ) {
        // eslint-disable-next-line unicorn/prefer-at
        items[items.length - 1].sublist = {
          items: parseList(inputText, nextLexem, lexems, errors),
          numberingStartingFrom: nextLexem.number,
        };
      } else {
        if (nextIndent > firstIndent) {
          errors.push({
            kind: "NotAlignedListMarkers",
            firstRange: firstLexem.range,
            notAlignedRange: nextLexem.range,
          });
        }
        // Next item is at the same level, so we can just consume the list-marker
        lexems.next();
        const content: MarkdownInlineAST[] = [];
        while (!isClosingLexem(lexems.peek())) {
          content.push(...parseInlineElements(inputText, lexems, errors));
        }
        items.push({ content, sublist: null });
      }
    }
  }

  return items;
};

const parseInlineElements = (
  inputText: string,
  lexems: Iterator<Lexem>,
  errors: MarkdownError[],
): MarkdownInlineAST[] => {
  const current = lexems.peek();

  if (current.kind === "text") {
    lexems.next();
    const text = inputText.slice(current.range.start, current.range.end);
    return text ? [{ kind: "normalString", value: text }] : [];
  }

  if (current.kind === "_") {
    return parseUntil(inputText, lexems, "_", "italic", errors);
  }
  if (current.kind === "*") {
    return parseUntil(inputText, lexems, "*", "italic", errors);
  }
  if (current.kind === "**") {
    return parseUntil(inputText, lexems, "**", "bold", errors);
  }

  if (current.kind === "[") {
    return parseLink(inputText, lexems, errors);
  }

  if (current.kind === "(" || current.kind === ")") {
    lexems.next();
    return [
      {
        kind: "normalString",
        value: inputText.slice(current.range.start, current.range.end),
      },
    ];
  }

  if (current.kind === "]") {
    errors.push({ kind: "ClosingBracketNotOpen", range: current.range });
    lexems.next();
    return [
      {
        kind: "normalString",
        value: inputText.slice(current.range.start, current.range.end),
      },
    ];
  }

  if (current.kind === "`") {
    lexems.next();
    const offsetBeforeWhile = lexems.getOffset();
    while (lexems.peek().kind !== "`" && !isClosingLexem(lexems.peek())) {
      lexems.next();
    }
    const closingLexem = lexems.next();
    if (closingLexem.kind === "`") {
      return [
        {
          kind: "formattedCode",
          value: inputText.slice(current.range.end, closingLexem.range.start),
        },
      ];
    } else {
      // We need to backtrack :/
      lexems.restoreOffset(offsetBeforeWhile);
      errors.push({ kind: "StylingTagNotClosed", range: current.range });
      return [
        {
          kind: "normalString",
          value: inputText.slice(current.range.start, current.range.end),
        },
        ...parseInlineElements(inputText, lexems, errors),
      ];
    }
  }

  return [];
};

const parseUntil = (
  inputText: string,
  lexems: Iterator<Lexem>,
  enclosingKind: LexemKindSimple,
  syntaxType: "bold" | "italic",
  errors: MarkdownError[],
): MarkdownInlineAST[] => {
  const firstLexem = lexems.peek();
  // Consume opening enclosingKind
  lexems.next();

  const content: MarkdownInlineAST[] = [];

  while (
    !isClosingLexem(lexems.peek())
    && lexems.peek().kind !== enclosingKind
  ) {
    const elements = parseInlineElements(inputText, lexems, errors);
    content.push(...elements);
  }

  // Consume closing enclosingKind
  if (lexems.peek().kind === enclosingKind) {
    lexems.next();
    return [{ kind: syntaxType, value: content }];
  }

  errors.push({ kind: "StylingTagNotClosed", range: firstLexem.range });
  return [
    {
      kind: "normalString",
      value: inputText.slice(firstLexem.range.start, firstLexem.range.end),
    },
    ...content,
  ];
};

const parseLink = (
  inputText: string,
  lexems: Iterator<Lexem>,
  errors: MarkdownError[],
): MarkdownInlineAST[] => {
  const openingBracketLexem = lexems.peek();
  // Consume opening [
  lexems.next();

  const content: MarkdownInlineAST[] = [];

  // Parse link text until ]
  while (!isClosingLexem(lexems.peek()) && lexems.peek().kind !== "]") {
    const elements = parseInlineElements(inputText, lexems, errors);
    content.push(...elements);
  }

  // Expect closing ]
  const closingBracketLexem = lexems.peek();
  if (closingBracketLexem.kind !== "]") {
    errors.push({ kind: "BracketNotClosed", range: openingBracketLexem.range });
    return [
      {
        kind: "normalString",
        value: inputText.slice(
          openingBracketLexem.range.start,
          openingBracketLexem.range.end,
        ),
      },
      ...content,
    ];
  }

  // Consuming ]
  lexems.next();

  // Expect opening (
  if (lexems.peek().kind !== "(") {
    // if no opening parenthesis, just consider this is not
    // a link and return the brackets and the content
    return [
      {
        kind: "normalString",
        value: inputText.slice(
          openingBracketLexem.range.start,
          openingBracketLexem.range.end,
        ),
      },
      ...content,
      {
        kind: "normalString",
        value: inputText.slice(
          closingBracketLexem.range.start,
          closingBracketLexem.range.end,
        ),
      },
    ];
  }

  const openingParenthesisLexem = lexems.next();
  while (
    lexems.peek().kind !== ")"
    && lexems.peek().kind !== "EOF"
    && lexems.peek().kind !== "paragraph-break"
  ) {
    lexems.next();
  }
  const closingParenthesisLexem = lexems.next();
  if (
    openingParenthesisLexem.kind !== "("
    || closingParenthesisLexem.kind !== ")"
  ) {
    errors.push({
      kind: "LinkWithoutUrl",
      range: openingParenthesisLexem.range,
    });
    return [
      {
        kind: "normalString",
        value: inputText.slice(
          openingBracketLexem.range.start,
          openingBracketLexem.range.end,
        ),
      },
      ...content,
      {
        kind: "normalString",
        value: inputText.slice(
          closingBracketLexem.range.start,
          closingParenthesisLexem.range.end,
        ),
      },
    ];
  }

  return [
    {
      kind: "link",
      value: content,
      url: inputText.slice(
        openingParenthesisLexem.range.end,
        closingParenthesisLexem.range.start,
      ),
    },
  ];
};

export const parseMarkdown = (
  text: string,
): { result: MarkdownAST; errors: MarkdownError[] } => {
  const lexems = lexifyMarkdown(text.toString());
  const iterator = new Iterator(lexems);
  const errors: MarkdownError[] = [];
  const blocks = parse(text.toString(), iterator, errors);
  return { result: { blocks }, errors };
};
