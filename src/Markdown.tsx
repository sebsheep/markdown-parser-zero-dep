import type { CSSProperties, ReactNode, Ref } from "react";
import {
  type MarkdownInlineAST,
  type MarkdownListItemAST,
  parseMarkdown,
} from "./parser.ts";


const mergeCn = (...classes: (string|null|false)[]) => classes.filter(Boolean).join(" ");

type Customization = { linkCn?: string; boldCn?: string; italicCn?: string };

export const Markdown = ({
  ref,
  style,
  markdown,
  className,  
  customization,  
  onFocus,
}: {
  ref?: Ref<HTMLDivElement | null>;
  markdown: string;
  className?: string;
  style?: CSSProperties;  
  customization?: Customization;
  textLeft?: boolean;
  onFocus?: () => void;
}) => {
  const {
    result: { blocks },
  } = parseMarkdown(markdown);
  return (
    <div
      ref={ref}
      className={mergeCn(
        "flex-col gap-10 overflow-hidden",
        className,        
      )}
      style={style}
      onClick={onFocus}
    >
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "paragraph":
            return (
              <p key={index} className="whitespace-pre-wrap">
                {block.content.map((content, subIdx) => (
                  <InlineMarkdown
                    key={subIdx}
                    inline={content}
                    inHeader={false}
                    customization={customization ?? {}}
                  />
                ))}
              </p>
            );
          case "header":
            return (
              <Header key={index} level={block.level}>
                {block.content.map((content, subIdx) => (
                  <InlineMarkdown
                    key={subIdx}
                    inline={content}
                    inHeader
                    customization={customization ?? {}}
                  />
                ))}
              </Header>
            );
          case "list":
            return (
              <List
                key={index}
                items={block.items}
                numberingStartingFrom={block.numberingStartingFrom}
                depth={0}
                customization={customization ?? {}}
              />
            );
          case "horizontal-line":
            return <hr key={index} />;
        }
      })}
    </div>
  );
};

const InlineMarkdown = ({
  inline,
  inHeader,
  customization,
}: {
  inline: MarkdownInlineAST;
  inHeader: boolean;
  customization: Customization;
}): ReactNode => {
  switch (inline.kind) {
    case "normalString":
      return inline.value;

    case "bold":
      return (
        <span
          className={mergeCn(
            inHeader ? "underline" : "font-bold",
            customization.boldCn,
          )}
        >
          {inline.value.map((content, index) => (
            <InlineMarkdown
              key={index}
              inline={content}
              inHeader={inHeader}
              customization={customization}
            />
          ))}
        </span>
      );
    case "italic":
      return (
        <span className={mergeCn("italic", customization.italicCn)}>
          {inline.value.map((content, index) => (
            <InlineMarkdown
              key={index}
              inline={content}
              inHeader={inHeader}
              customization={customization}
            />
          ))}
        </span>
      );
    case "link":
      return (
        <a
          href={inline.url}
          className={mergeCn("underline text-blue-500", customization.linkCn)}
          target="_blank"
        >
          {inline.value.map((content, index) => (
            <InlineMarkdown
              key={index}
              inline={content}
              inHeader={inHeader}
              customization={customization}
            />
          ))}
        </a>
      );
    case "formattedCode":
      return (
        <span className="border bg-grey-100 rounded-sm px-2 font-mono">
          {inline.value}
        </span>
      );
  }
};

const Header = ({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) => {
  switch (level) {
    case 1:
      return <h1 className="text-18 mt-16 first:mt-0 font-bold">{children}</h1>;
    case 2:
      return <h2 className="text-16 font-bold">{children}</h2>;
    case 3:
      return <h3 className="text-14 font-bold">{children}</h3>;
    case 4:
      return <h4 className="text-14 font-medium">{children}</h4>;
    case 5:
      return <h5 className="text-14 font-medium">{children}</h5>;
    case 6:
      return <h6 className="text-14 font-medium">{children}</h6>;
    default:
      return <h6 className="text-14 font-medium">{children}</h6>;
  }
};

const List = ({
  items,
  numberingStartingFrom,
  depth,
  customization,
}: {
  items: MarkdownListItemAST[];
  numberingStartingFrom: number | null;
  depth: number;
  customization: Customization;
}) => {
  const children = items.map((item, index) => (
    <li
      key={index}
      className={mergeCn("whitespace-pre-wrap", depth === 0 && index > 0 && "mt-2")}
    >
      {item.content.map((content, subIdx) => (
        <InlineMarkdown
          key={subIdx}
          inline={content}
          inHeader={false}
          customization={customization}
        />
      ))}
      {item.sublist && (
        <List
          items={item.sublist.items}
          numberingStartingFrom={item.sublist.numberingStartingFrom}
          depth={depth + 1}
          customization={customization}
        />
      )}
    </li>
  ));
  return numberingStartingFrom === null ?
      <ul
        className={mergeCn(
          "list-outside ml-8 pl-8",
          depth === 0 ? "list-disc"
          : depth === 1 ? "list-circle"
          : "list-square",
        )}
      >
        {children}
      </ul>
    : <ol
        className="list-outside list-decimal ml-8 pl-8"
        start={numberingStartingFrom}
      >
        {children}
      </ol>;
};