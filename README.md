# Zero dependency Markdown parser

A zero-dependency markdown parser. Even for the tests.

## Live Demo

Check out the [live demo](https://markdown-parser-zero-dep.netlify.app/) to see it in action.

## Main commands:

- `bun install`: install the dependencies
- `bun dev`: start the development server
- `bun run build`: build the project for production
- `bun run test`: run the snapshot tests
- `bun run fuzz`: run the fuzzy tests

## Why such a parser?

I was used to use kind of "heavy" library to parse markdown. By heavy I mean:

- a bunch of dependencies (which I had to trust),
- a lot of features (my users barely need minimal markdown features: headers, lists, links, bold, italic, formatted code, horizontal rules. That's it.),
- a convoluted API, hard to customize.

The last point triggered me to build my own parser. I wanted to have full control over the rendering.

The `src/parser.ts` file is my answer to this. It's a single 500 lines file parsing all the markdown features I need. It outputs a simple description of the markdown document which can be easily converted to a React component (see `src/Markdown.tsx`) or any other format (for example, a plain HTML string for an email, see `src/markdownToHtml.ts`).

### Snapshot testing

The parser is kind of complicated (because Markdown is complicated!) and absolutely need tests. Since I didn't want pull a dependency, I wrote a little library of snapshot tests.

It's dead simple: a test outputs a string. On the first run, this string is displayed in the console and if the user confirms, it's written to a file.

The next time it runs, it compares the output with the file and if it differs, the lib asks the user if they want to update the file or not.

This kind of tests is really adapted for a parser as you can easily change the structure of the output without having to manually rewrite all the tests (you just have to review the changes).

### Fuzzy testing

Snapshot tests cover cases we already thought of. But what about the cases we didn't think of? That's where fuzzy testing comes in. The general idea behind fuzzy testing is to generate random inputs and check if the output verifies some "properties" (you can for example check out this library: https://github.com/dubzzz/fast-check).

In my case, the "property" I wanted to verify is "does the parser loop forever?". Once again, I didn't want to pull a dependency, so I wrote a little module that loop over:

1. generating a random string,
2. printing the string to the console,
3. parse the string.

The step 3. shouldn't take more than 10 milli seconds, except if the parser enters an infinite loop. In this case, I
can see that the test is "blocked" and I can abort it (with `Ctrl+C`). I can then inspect the string that caused the loop and fix the parser.

Fuzzy testing libraries put a lot of effort to "shrink" the input to the minimal string that still do not verify the tested property. It can be useful, but in my caseit turned out that manually splitting the string allowed me to find the issue in a reasonable time. This saved me a bunch of engineering efforts.

Once again, I like dead simple stuff.

## I want to use this package, where can I find it on NPM?

The idea behind being "zero-dependency" is to encourage you to use reduce the number of dependencies you use
(because dependencies have important drawbacks: they can be a security risk and you cannot easily edit them).
I personally have this `parser.ts` file incuded my projects as a "local dependency". I encourage you to do the same
and adapt `Markdown.tsx` and/or `markdownToHtml.ts` to fully integrate markdown rendering in your project.

If you want to customise the parser, pull the tests files in your project and use them to test your custom parser.
