"use client"

import { useEffect, useState, type ReactNode } from "react"
import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  PaintBucket,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  Columns,
  AlertCircle,
  Sparkles,
  Table,
  Video,
} from "lucide-react"
import { notifications } from "@/lib/notifications"
import { LinkDialog } from "./link-dialog"
import { ImageDialog } from "./image-dialog"
import { TableDialog } from "./table-dialog"
import { VideoDialog } from "./video-dialog"

export interface ToolbarProps {
  editor: Editor | null
}

export function Toolbar({ editor }: ToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [lastSelection, setLastSelection] = useState({ from: 1, to: 1 })

  if (!editor) {
    return null
  }

  const activeButtonClass = "bg-primary/10 text-primary border-primary/30"

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : editor.isActive("heading", { level: 4 })
          ? "h4"
          : "paragraph"

  const applyHeading = (value: string) => {
    const chain = editor.chain().focus()
    const { selection, doc } = editor.state
    const { from, to, empty, $from, $to } = selection

    if (value === "paragraph") {
      chain.setParagraph().run()
      return
    }

    const level = Number(value.replace("h", "")) as 1 | 2 | 3 | 4

    // When only part of a paragraph is selected, split it and convert only the selected
    // fragment into a heading to avoid changing the whole paragraph unexpectedly.
    if (!empty && $from.sameParent($to) && $from.parent.type.name === "paragraph") {
      const selectedText = doc.textBetween(from, to, "\n").trim()

      if (selectedText.length > 0) {
        const parentStart = $from.start()
        const parentEnd = $from.end()
        const nodeFrom = $from.before()
        const nodeTo = $from.after()

        const beforeText = doc.textBetween(parentStart, from, "\n")
        const afterText = doc.textBetween(to, parentEnd, "\n")

        const content: Array<{ type: string; attrs?: Record<string, unknown>; content?: Array<{ type: string; text: string }> }> = []

        if (beforeText.length > 0) {
          content.push({
            type: "paragraph",
            content: [{ type: "text", text: beforeText }],
          })
        }

        content.push({
          type: "heading",
          attrs: { level },
          content: [{ type: "text", text: selectedText }],
        })

        if (afterText.length > 0) {
          content.push({
            type: "paragraph",
            content: [{ type: "text", text: afterText }],
          })
        }

        editor.chain().focus().insertContentAt({ from: nodeFrom, to: nodeTo }, content).run()
        return
      }
    }

    chain.setNode("heading", { level }).run()
  }

  const selectedColor = (editor.getAttributes("textStyle").color as string | undefined) || "#111827"
  const selectedBackgroundColor = (editor.getAttributes("textStyle").backgroundColor as string | undefined) || "#fef08a"
  const selectedFontSize = (editor.getAttributes("textStyle").fontSize as string | undefined) || "16px"

  const colorInputValue = /^#[0-9a-fA-F]{6}$/.test(selectedColor) ? selectedColor : "#111827"
  const backgroundColorInputValue = /^#[0-9a-fA-F]{6}$/.test(selectedBackgroundColor)
    ? selectedBackgroundColor
    : "#fef08a"

  useEffect(() => {
    const updateSelection = () => {
      const { from, to } = editor.state.selection
      setLastSelection((prev) => {
        if (prev.from === from && prev.to === to) {
          return prev
        }
        return { from, to }
      })
    }

    updateSelection()
    editor.on("selectionUpdate", updateSelection)

    return () => {
      editor.off("selectionUpdate", updateSelection)
    }
  }, [editor])

  const applyFontColor = (color: string) => {
    editor
      .chain()
      .focus()
      .setTextSelection(lastSelection)
      .setColor(color)
      .run()
  }

  const applyBackgroundColor = (color: string) => {
    editor
      .chain()
      .focus()
      .setTextSelection(lastSelection)
      .setBackgroundColor(color)
      .run()
  }

  const applyFontSize = (size: string) => {
    editor
      .chain()
      .focus()
      .setTextSelection(lastSelection)
      .setMark("textStyle", { fontSize: size })
      .run()
  }

  const removeFontSize = () => {
    editor
      .chain()
      .focus()
      .setTextSelection(lastSelection)
      .updateAttributes("textStyle", { fontSize: null })
      .run()
  }

  const toggleBulletList = () => {
    const applied = editor.chain().focus().toggleBulletList().run()
    if (!applied) {
      editor.chain().focus().setParagraph().toggleBulletList().run()
    }
  }

  const toggleOrderedList = () => {
    const applied = editor.chain().focus().toggleOrderedList().run()
    if (!applied) {
      editor.chain().focus().setParagraph().toggleOrderedList().run()
    }
  }

  const insertTwoColumn = () => {
    const applied = editor.chain().focus().setTwoColumn({}).run()

    if (!applied) {
      editor.chain().focus().insertContent("<p>Unable to insert two-column layout here.</p>").run()
    }
  }

  const insertInfoCallout = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "callout",
        attrs: { type: "info" },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Info callout text..." }],
          },
        ],
      })
      .run()
  }

  const insertHighlightQuote = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "highlightQuote",
        attrs: { author: null },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Highlighted quote text..." }],
          },
        ],
      })
      .run()
  }

  const insertTable = ({ rows, cols, withHeaderRow }: { rows: number; cols: number; withHeaderRow: boolean }) => {
    const chain = editor.chain().focus()

    if (editor.can().insertTable({ rows, cols, withHeaderRow })) {
      chain.insertTable({ rows, cols, withHeaderRow }).run()
      return
    }

    // Fallback: move to a valid paragraph context, then insert table.
    editor
      .chain()
      .focus()
      .insertContent("<p></p>")
      .insertTable({ rows, cols, withHeaderRow })
      .run()
  }

  const deleteSelectedImage = () => {
    const removed = editor
      .chain()
      .focus()
      .command(({ tr, state, dispatch }) => {
        const isImageNode = (name: string) => name === "customImage" || name === "image"
        let removed = false

        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (isImageNode(node.type.name)) {
            tr.delete(pos, pos + node.nodeSize)
            removed = true
            return false
          }
          return true
        })

        if (!removed) {
          const $from = state.selection.$from
          const nodeAfter = $from.nodeAfter
          const nodeBefore = $from.nodeBefore

          if (nodeAfter && isImageNode(nodeAfter.type.name)) {
            tr.delete($from.pos, $from.pos + nodeAfter.nodeSize)
            removed = true
          } else if (nodeBefore && isImageNode(nodeBefore.type.name)) {
            tr.delete($from.pos - nodeBefore.nodeSize, $from.pos)
            removed = true
          }
        }

        if (removed && dispatch) {
          dispatch(tr)
        }

        return removed
      })
      .run()

    if (removed) {
      notifications.showSuccess({
        title: "Image deleted",
        description: "Selected image was removed from the editor.",
      })
    } else {
      notifications.showInfo({
        title: "Select an image",
        description: "Click an image first, then delete it.",
      })
    }
  }

  const getSelectedTwoColumnRange = () => {
    const { state } = editor
    const { selection } = state

    let range: { from: number; to: number } | null = null

    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === "twoColumn") {
        range = { from: pos, to: pos + node.nodeSize }
        return false
      }
      return true
    })

    if (range) return range

    const findAncestorRange = (resolvedPos: typeof selection.$from) => {
      for (let depth = resolvedPos.depth; depth > 0; depth--) {
        if (resolvedPos.node(depth).type.name === "twoColumn") {
          return {
            from: resolvedPos.before(depth),
            to: resolvedPos.after(depth),
          }
        }
      }
      return null
    }

    return findAncestorRange(selection.$from) || findAncestorRange(selection.$to)
  }

  const hasSelectedTwoColumn = Boolean(getSelectedTwoColumnRange())

  const deleteSelectedLayout = () => {
    const range = getSelectedTwoColumnRange()

    if (!range) {
      notifications.showInfo({
        title: "Select a layout",
        description: "Place your cursor inside the two-column layout, then delete it.",
      })
      return
    }

    const removed = editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        tr.delete(range.from, range.to)
        if (dispatch) {
          dispatch(tr)
        }
        return true
      })
      .run()

    if (removed) {
      notifications.showSuccess({
        title: "Layout deleted",
        description: "Two-column layout was removed.",
      })
    }
  }

  const hasSelectedTable = editor.isActive("table")

  const deleteSelectedTable = () => {
    const removed = editor.chain().focus().deleteTable().run()

    if (removed) {
      notifications.showSuccess({
        title: "Table deleted",
        description: "Selected table was removed from the editor.",
      })
    } else {
      notifications.showInfo({
        title: "Select a table",
        description: "Place your cursor inside the table, then delete it.",
      })
    }
  }

  const hasSelectedImage = (() => {
    const state = editor.state
    const isImageNode = (name: string) => name === "customImage" || name === "image"
    let found = false

    state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
      if (isImageNode(node.type.name)) {
        found = true
        return false
      }
      return true
    })

    if (found) return true

    const $from = state.selection.$from
    return Boolean(
      ($from.nodeAfter && isImageNode($from.nodeAfter.type.name)) ||
        ($from.nodeBefore && isImageNode($from.nodeBefore.type.name)),
    )
  })()

  const ActionButton = ({
    onClick,
    isActive = false,
    ariaLabel,
    children,
    disabled = false,
  }: {
    onClick: () => void
    isActive?: boolean
    ariaLabel: string
    children: ReactNode
    disabled?: boolean
  }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`h-9 min-w-9 cursor-pointer px-2.5 ${isActive ? activeButtonClass : "bg-background"}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children}
    </Button>
  )

  return (
    <div className="border-b bg-gradient-to-b from-muted/50 to-muted/20 p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Type</span>
            <Select value={currentHeading} onValueChange={applyHeading}>
              <SelectTrigger className="h-8 w-[150px] cursor-pointer border-none bg-transparent px-2 text-sm shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="h1">Heading 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Heading 3</SelectItem>
                <SelectItem value="h4">Heading 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Style</span>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              ariaLabel="Bold"
            >
              <Bold className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              ariaLabel="Italic"
            >
              <Italic className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              ariaLabel="Underline"
            >
              <Underline className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              ariaLabel="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              ariaLabel="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </ActionButton>

            <Separator orientation="vertical" className="mx-1 h-5" />
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Font Color</span>
              <input
                type="color"
                value={colorInputValue}
                onChange={(event) => {
                  applyFontColor(event.target.value)
                }}
                className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Foreground color"
                title="Foreground color"
              />
            </label>
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground">
              <PaintBucket className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Background</span>
              <input
                type="color"
                value={backgroundColorInputValue}
                onChange={(event) => {
                  applyBackgroundColor(event.target.value)
                }}
                className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Background color"
                title="Background color"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                editor.chain().focus().unsetColor().unsetBackgroundColor().run()
              }}
              className="h-9 cursor-pointer bg-background px-2.5 text-xs"
              title="Reset colors"
            >
              Reset
            </Button>

            <Separator orientation="vertical" className="mx-1 h-5" />
            <Select value={selectedFontSize} onValueChange={applyFontSize}>
              <SelectTrigger className="h-8 w-[100px] cursor-pointer border bg-background px-2 text-xs shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12px">12px</SelectItem>
                <SelectItem value="14px">14px</SelectItem>
                <SelectItem value="16px">16px</SelectItem>
                <SelectItem value="18px">18px</SelectItem>
                <SelectItem value="20px">20px</SelectItem>
                <SelectItem value="24px">24px</SelectItem>
                <SelectItem value="28px">28px</SelectItem>
                <SelectItem value="32px">32px</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeFontSize}
              className="h-9 cursor-pointer bg-background px-2.5 text-xs"
              title="Reset font size"
            >
              Default
            </Button>
          </div>

          <div className="ml-auto inline-flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
            <ActionButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              ariaLabel="Undo"
            >
              <Undo className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              ariaLabel="Redo"
            >
              <Redo className="h-4 w-4" />
            </ActionButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Lists</span>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionButton
              onClick={toggleBulletList}
              isActive={editor.isActive("bulletList")}
              ariaLabel="Bullet List"
            >
              <List className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={toggleOrderedList}
              isActive={editor.isActive("orderedList")}
              ariaLabel="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              ariaLabel="Horizontal Rule"
            >
              <Minus className="h-4 w-4" />
            </ActionButton>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Media</span>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionButton
              onClick={() => setIsLinkDialogOpen(true)}
              isActive={editor.isActive("link")}
              ariaLabel="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </ActionButton>
            <ActionButton onClick={() => setIsImageDialogOpen(true)} ariaLabel="Insert Image">
              <ImageIcon className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={deleteSelectedImage}
              isActive={hasSelectedImage}
              disabled={!hasSelectedImage}
              ariaLabel={hasSelectedImage ? "Delete Selected Image" : "Select an image to delete"}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
            <ActionButton onClick={() => setIsVideoDialogOpen(true)} ariaLabel="Embed Video">
              <Video className="h-4 w-4" />
            </ActionButton>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Layout</span>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ActionButton
              onClick={insertTwoColumn}
              ariaLabel="Two Column Layout"
            >
              <Columns className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={deleteSelectedLayout}
              isActive={hasSelectedTwoColumn}
              disabled={!hasSelectedTwoColumn}
              ariaLabel={hasSelectedTwoColumn ? "Delete Selected Layout" : "Select a two-column layout to delete"}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={insertInfoCallout}
              ariaLabel="Insert Callout"
            >
              <AlertCircle className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={insertHighlightQuote}
              ariaLabel="Highlight Quote"
            >
              <Sparkles className="h-4 w-4" />
            </ActionButton>
            <ActionButton onClick={() => setIsTableDialogOpen(true)} ariaLabel="Insert Table">
              <Table className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              onClick={deleteSelectedTable}
              isActive={hasSelectedTable}
              disabled={!hasSelectedTable}
              ariaLabel={hasSelectedTable ? "Delete Selected Table" : "Select a table to delete"}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      <LinkDialog editor={editor} isOpen={isLinkDialogOpen} onClose={() => setIsLinkDialogOpen(false)} />
      
      {/* Image Dialog */}
      <ImageDialog editor={editor} isOpen={isImageDialogOpen} onClose={() => setIsImageDialogOpen(false)} />

      {/* Table Dialog */}
      <TableDialog
        isOpen={isTableDialogOpen}
        onClose={() => setIsTableDialogOpen(false)}
        onInsert={insertTable}
      />
      
      {/* Video Dialog */}
      <VideoDialog editor={editor} isOpen={isVideoDialogOpen} onClose={() => setIsVideoDialogOpen(false)} />
    </div>
  )
}
