import Image from "@tiptap/extension-image"

export interface ImageAttributes {
  src: string
  alt?: string
  caption?: string
  align?: "left" | "center" | "right"
  width?: "small" | "medium" | "full"
}

export const CustomImage = Image.extend({
  name: "customImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {}
          }
          return { src: attributes.src }
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
        renderHTML: (attributes) => {
          if (!attributes.alt) {
            return {}
          }
          return { alt: attributes.alt }
        },
      },
      caption: {
        default: null,
        parseHTML: (element) => {
          const figure = element.closest("figure")
          const figcaption = figure?.querySelector("figcaption")
          return figcaption?.textContent || null
        },
        renderHTML: (attributes) => {
          // Caption is rendered separately in the node view
          return {}
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const figure = element.closest("figure")
          return (figure?.getAttribute("data-align") as ImageAttributes["align"]) || "center"
        },
        renderHTML: (attributes) => {
          return { "data-align": attributes.align || "center" }
        },
      },
      width: {
        default: "medium",
        parseHTML: (element) => {
          const figure = element.closest("figure")
          return (figure?.getAttribute("data-width") as ImageAttributes["width"]) || "medium"
        },
        renderHTML: (attributes) => {
          return { "data-width": attributes.width || "medium" }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
      {
        tag: "figure[data-type='image'] img",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, align, width, ...imgAttrs } = HTMLAttributes

    // If there's a caption, wrap in figure
    if (caption) {
      return [
        "figure",
        {
          class: "image-wrapper",
          "data-type": "image",
          "data-align": align || "center",
          "data-width": width || "medium",
        },
        ["img", imgAttrs],
        ["figcaption", {}, caption],
      ]
    }

    // Otherwise, just render img with data attributes on a wrapper
    return [
      "figure",
      {
        class: "image-wrapper",
        "data-type": "image",
        "data-align": align || "center",
        "data-width": width || "medium",
      },
      ["img", imgAttrs],
    ]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage:
        (options: ImageAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
      updateImageAttributes:
        (attrs: Partial<ImageAttributes>) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
    }
  },
})
