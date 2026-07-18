import { useState } from "react";
import { Markdown } from "./Markdown.tsx";

const INITIAL_MARKDOWN = `# Markdown live preview

Type some **markdown** in the textarea on the left, it will be rendered on the right.

## Features

- *Italic*, **bold** and \`inline code\`
- [Links](https://example.com)
- Nested lists:
  1. First
  2. Second
- Horizontal rule below

You can even start lists with an arbitrary number:
5. And [having **styles** _inside_ links!](https://example.com)
---

Enjoy!
`;

export const Example = () => {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);

  return (
    <div className="h-screen w-screen flex-col gap-16 p-16 box-border">
      <div className="flex items-center gap-8">
        <h1 className="text-18 font-bold">Markdown parser demo</h1>
        <a
          href="https://github.com/sebsheep/markdown-parser-zero-dep"
          target="_blank"
          rel="noreferrer"
          className="text-14 text-blue-500 hover:underline"
        >
          See on GitHub
        </a>
      </div>
      <div className="flex-1 flex gap-16 min-h-0">
        <textarea
          value={markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          className="flex-1 h-full resize-none rounded-md border border-gray-300 p-12 font-mono text-14 outline-none focus:border-blue-500"
          placeholder="Type your markdown here..."
          spellCheck={false}
        />
        <div className="flex-1 h-full overflow-auto rounded-md border border-gray-300 p-12">
          <Markdown markdown={markdown} />
        </div>
      </div>
    </div>
  );
};
