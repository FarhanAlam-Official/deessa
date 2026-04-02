import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlightQuote: {
      setHighlightQuote: (author?: string) => ReturnType
    }
  }
}

export const HighlightQuote = Node.create({
  name: "highlightQuote",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (element) => {
          const cite = element.querySelector("cite")
          return cite?.textContent || null
        },
        renderHTML: (attributes) => {
          return {}
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="highlight-quote"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { author, ...attrs } = HTMLAttributes

    return [
      "div",
      mergeAttributes(attrs, {
        class: "highlight-quote",
        "data-type": "highlight-quote",
      }),
      ["blockquote", {}, 0],
      ...(author ? [["cite", {}, author]] : []),
    ]
  },

  addCommands() {
    return {
      setHighlightQuote:
        (author?: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { author: author || null },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Highlighted quote text..." }],
              },
            ],
          })
        },
    }
  },
})
