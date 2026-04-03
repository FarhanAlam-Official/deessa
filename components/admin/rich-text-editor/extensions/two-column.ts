import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twoColumn: {
      setTwoColumn: (attrs?: { leftContent?: string; rightContent?: string }) => ReturnType
    }
  }
}

export const TwoColumnSection = Node.create({
  name: "twoColumnSection",

  group: "block",

  content: "block+",

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      position: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-position") || "left",
        renderHTML: (attributes) => ({
          "data-position": attributes.position,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="two-column-section"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const position = HTMLAttributes.position === "right" ? "right" : "left"

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: position === "right" ? "column-right" : "column-left",
        "data-type": "two-column-section",
      }),
      0,
    ]
  },
})

export const TwoColumn = Node.create({
  name: "twoColumn",

  group: "block",

  content: "twoColumnSection twoColumnSection",

  defining: true,

  isolating: true,

  addExtensions() {
    return [TwoColumnSection]
  },

  addAttributes() {
    return {
      leftContent: {
        default: "",
      },
      rightContent: {
        default: "",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="two-column"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "two-column-layout",
        "data-type": "two-column",
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setTwoColumn:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
            content: [
              {
                type: "twoColumnSection",
                attrs: { position: "left" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: attrs?.leftContent || "Left column content..." }],
                  },
                ],
              },
              {
                type: "twoColumnSection",
                attrs: { position: "right" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: attrs?.rightContent || "Right column content..." }],
                  },
                ],
              },
            ],
          })
        },
    }
  },
})
