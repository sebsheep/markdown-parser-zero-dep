# Zero dependency Markdown parser

A zero-dependency markdown parser. Even for the tests.

## Live Demo

Check out the [live demo](https://markdown-parser-zero-dep.netlify.app/) to see it in action.

## Main commands:

- `bun install`: install React dependencies (the only ones, needed for the demo)
- `bun dev`: start the development server
- `bun run build`: build the project for production
- `bun run test`: run the snapshot tests
- `bun run fuzz`: run the fuzzy tests

## Why such a parser?

I was used to use kind of "heavy" library to use markdown. By heavy I mean:

- a bunch of dependencies (which I had to trust),
- a lot of features (my users barely need minimal markdown features: headers, lists, links, bold, italic, formatted code, horizontal rules. That's it.),
- no way to warn the user that the markdown is invalid,
- a convoluted API, where the rendering is hard to customize.

The last point triggered me to build this project. I wanted to have full control over the rendering.

In addition, my users also needed to use some variable to include dynamic content and other formatting features (like highlighting some words). It was pretty straighforward to integrate this into the parser (these features are not included in this repository).

It turns out that "using Markdown" can be split into two parts:

1. parsing the markdown document into a simple description of the document
2. converting the description to a React component or any other format

The first part is kind of complicated, but the second part is really easy.

The `src/parser.ts` file is my answer to this frustration. It's a single 500 lines file parsing all the markdown features I need. It outputs a simple description in JSON format of the markdown document which can be easily converted to a React, Vue, Svelte, Angular component or any other format.

## How to use it?

Here is some markdown:

```markdown
This is a **bold** text. This is a [link](https://example.com)
```

The parser will output this description:

```json
{
  "blocks": [
    {
      "kind": "paragraph",
      "content": [
        { "kind": "normalString", "value": "This is a " },
        {
          "kind": "bold",
          "value": [{ "kind": "normalString", "value": "bold" }]
        },
        { "kind": "normalString", "value": " text. This is a " },
        {
          "kind": "link",
          "value": [{ "kind": "normalString", "value": "link" }],
          "url": "https://example.com"
        }
      ]
    }
  ]
}
```

So a markdown is list of blocks. A block can be a paragraph (`kind: "paragraph"`), a header (`kind: "header"`), a list (`kind: "list"`), or a horizontal line (`kind: "horizontal-line"`).

A paragraph is a list of inline elements. An inline element can be a normal string (`kind: "normalString"`), a bold (`kind: "bold"`), an italic (`kind: "italic"`), a link (`kind: "link"`), or a formatted code (`kind: "formattedCode"`).

Note that `bold`, `italic` and `link` have a `value` field that is a list of inline elements. This is because these elements can be nested. For example, a bold text can contain a link: `**[link](https://example.com)**`.

The complete type is exported in the [`src/parser.ts`](src/parser.ts) file with the `MarkdownAST` type.

Check out the [`src/Markdown.tsx`](src/Markdown.tsx) file to see how to convert the AST to a React component. You can also check out the [`src/markdownToHtml.ts`](src/markdownToHtml.ts) file to see how to convert the AST to a plain HTML string.

## Snapshot testing

The parser is kind of complicated (because Markdown is complicated!) and absolutely needs tests. Since I didn't want pull a dependency, I wrote a little library of snapshot tests.

It's dead simple: a test outputs a string. On the first run, this string is displayed in the console and if the user confirms, it's written to a file.

The next time it runs, it compares the output with the file and if it differs, the lib asks the user if they want to update the file or not.

This kind of tests is really adapted for a parser as you can easily change the structure of the output without having to manually rewrite all the tests (you just have to review the changes).

## Fuzzy testing

Snapshot tests cover cases we already thought of. But what about the cases we didn't think of? That's where fuzzy testing comes in. The general idea behind fuzzy testing is to generate random inputs and check if the output verifies some "properties" (you can for example check out this library: https://github.com/dubzzz/fast-check).

In my case, the "property" I wanted to verify is "does the parser loop forever?". Once again, I didn't want to pull a dependency, so I wrote a little module that loop over:

1. generating a random string,
2. printing the string to the console,
3. parse the string.

The step 3. shouldn't take more than 10 milliseconds, except if the parser enters an infinite loop. In this case, I
can see that the test is "blocked" and I can abort it (with `Ctrl+C`). I can then inspect the string that caused the loop and fix the parser.

Fuzzy testing libraries put a lot of effort to "shrink" the input to the minimal string that still do not verify the tested property. It can be useful, but in my case it turned out that manually splitting the string allowed me to find the issue in a reasonable amount of time. This saved me a bunch of engineering efforts.

Once again, I like dead simple stuff.

## I want to use this package, where can I find it on NPM?

Short answer: you can't.

The idea behind being "zero-dependency" is to encourage you to reduce the number of dependencies you use
(because dependencies have important drawbacks: they can be a security risk and you cannot easily customise them).
I personally have this `parser.ts` file incuded my projects as a "local dependency". I encourage you to do the same
and adapt `Markdown.tsx` and/or `markdownToHtml.ts` to fully integrate markdown rendering in your project style.

If you want to customise the parser, pull the tests files in your project and use them to test your custom parser.
