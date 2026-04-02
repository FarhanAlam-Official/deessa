import { Extension } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textStyleWithFontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const TextStyleWithFontSize = Extension.create({
  name: "textStyleWithFontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }) => {
          return commands.setMark("textStyle", { fontSize })
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.updateAttributes("textStyle", {
            fontSize: null,
          })
        },
    }
  },
})
