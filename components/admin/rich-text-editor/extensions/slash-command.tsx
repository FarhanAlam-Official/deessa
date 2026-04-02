import { Extension } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion"
import tippy, { Instance as TippyInstance } from "tippy.js"
import { SlashMenu, SlashMenuRef } from "../slash-menu"

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command(editor)
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .run()
        },
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        render: () => {
          let component: ReactRenderer<SlashMenuRef> | undefined
          let popup: TippyInstance[] | undefined

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashMenu, {
                props: {
                  ...props,
                  onSelect: (command: any) => {
                    props.command(command)
                  },
                },
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                maxWidth: "none",
              })
            },

            onUpdate(props: any) {
              component?.updateProps({
                ...props,
                onSelect: (command: any) => {
                  props.command(command)
                },
              })

              if (!props.clientRect) {
                return
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect,
              })
            },

            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide()
                return true
              }

              return component?.ref?.onKeyDown(props.event) ?? false
            },

            onExit() {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
      }),
    ]
  },
})
