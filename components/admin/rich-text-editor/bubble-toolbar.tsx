"use client"

import { type Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { LinkDialog } from "./link-dialog"

export interface BubbleToolbarProps {
  editor: Editor | null
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const updateBubbleMenu = () => {
      const { selection } = editor.state
      const { empty } = selection

      // Hide if selection is empty
      if (empty) {
        setIsVisible(false)
        return
      }

      // Hide if in code block
      if (editor.isActive("codeBlock")) {
        setIsVisible(false)
        return
      }

      // Get selection coordinates
      const { from, to } = selection
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)

      // Calculate position
      const editorRect = editor.view.dom.getBoundingClientRect()
      const bubbleWidth = bubbleRef.current?.offsetWidth || 300
      
      const left = ((start.left + end.left) / 2) - (bubbleWidth / 2)
      const top = start.top - editorRect.top - 50 // Position above selection

      setPosition({ top, left })
      setIsVisible(true)
    }

    // Update on selection change
    editor.on("selectionUpdate", updateBubbleMenu)
    editor.on("update", updateBubbleMenu)

    return () => {
      editor.off("selectionUpdate", updateBubbleMenu)
      editor.off("update", updateBubbleMenu)
    }
  }, [editor])

  if (!editor || !isVisible) {
    return null
  }

  const activeButtonClass = "bg-primary/10 text-primary border-primary/30"

  return (
    <>
      <div
        ref={bubbleRef}
        className="absolute z-50 flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 shadow-lg"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 min-w-8 cursor-pointer px-2 ${editor.isActive("bold") ? activeButtonClass : "bg-background"}`}
          aria-label="Bold"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 min-w-8 cursor-pointer px-2 ${editor.isActive("italic") ? activeButtonClass : "bg-background"}`}
          aria-label="Italic"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 min-w-8 cursor-pointer px-2 ${editor.isActive("underline") ? activeButtonClass : "bg-background"}`}
          aria-label="Underline"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 min-w-8 cursor-pointer px-2 ${editor.isActive("strike") ? activeButtonClass : "bg-background"}`}
          aria-label="Strikethrough"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsLinkDialogOpen(true)}
          className={`h-8 min-w-8 cursor-pointer px-2 ${editor.isActive("link") ? activeButtonClass : "bg-background"}`}
          aria-label="Insert Link"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Dialog */}
      <LinkDialog
        editor={editor}
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
      />
    </>
  )
}
