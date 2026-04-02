"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import Color from "@tiptap/extension-color"
import { BackgroundColor, TextStyle } from "@tiptap/extension-text-style"
import { TableKit } from "@tiptap/extension-table"
import Youtube from "@tiptap/extension-youtube"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import { useEffect, useRef } from "react"
import { Toolbar } from "./rich-text-editor/toolbar"
import { BubbleToolbar } from "./rich-text-editor/bubble-toolbar"
import { CustomImage } from "./rich-text-editor/extensions/custom-image"
import { TwoColumn, TwoColumnSection } from "./rich-text-editor/extensions/two-column"
import { Callout } from "./rich-text-editor/extensions/callout"
import { HighlightQuote } from "./rich-text-editor/extensions/highlight-quote"
import { SlashCommand } from "./rich-text-editor/extensions/slash-command"
import { TextStyleWithFontSize } from "./rich-text-editor/extensions/text-style-with-font-size"
import { useAutosave } from "./rich-text-editor/hooks/use-autosave"
import { autosaveStory } from "@/lib/actions/admin-stories"
import { Loader2, Check, AlertCircle } from "lucide-react"

export interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onSave?: () => void
  onAutosaveComplete?: () => void // Callback when autosave completes successfully
  placeholder?: string
  className?: string
  editable?: boolean
  storyId?: string // For autosave
  enableAutosave?: boolean // Enable/disable autosave
}

export function RichTextEditor({
  content,
  onChange,
  onSave,
  onAutosaveComplete,
  placeholder = "Start writing your story...",
  className = "",
  editable = true,
  storyId,
  enableAutosave = false,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  const lastEmittedHtmlRef = useRef(content)
  const pendingHtmlRef = useRef(content)
  const emitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Autosave integration
  const { isSaving, lastSaved, error: autosaveError } = useAutosave({
    content,
    storyId,
    enabled: enableAutosave && !!storyId,
    onSave: async (contentToSave) => {
      if (!storyId) return
      const result = await autosaveStory(storyId, contentToSave)
      if (result.error) {
        throw new Error(result.error)
      }
      // Notify parent that autosave completed successfully
      if (onAutosaveComplete) {
        onAutosaveComplete()
      }
    },
  })

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
        },
        validate: (href) => {
          // Validate URLs start with http://, https://, or /
          return /^(https?:\/\/|\/)/i.test(href)
        },
      }),
      Underline,
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
      BackgroundColor.configure({
        types: ["textStyle"],
      }),
      TableKit.configure({
        table: {
          resizable: true,
        },
      }),
      CustomImage,
      TwoColumnSection,
      TwoColumn,
      Callout,
      HighlightQuote,
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: "video-embed",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      SlashCommand,
      TextStyleWithFontSize,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()

      if (html === pendingHtmlRef.current) {
        return
      }

      pendingHtmlRef.current = html

      if (emitTimerRef.current) {
        clearTimeout(emitTimerRef.current)
      }

      // Debounce parent updates to avoid re-rendering the whole form on every keystroke.
      emitTimerRef.current = setTimeout(() => {
        if (pendingHtmlRef.current !== lastEmittedHtmlRef.current) {
          lastEmittedHtmlRef.current = pendingHtmlRef.current
          onChangeRef.current(pendingHtmlRef.current)
        }
      }, 120)
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[460px] px-5 py-4",
      },
    },
  })

  // Update editor content when prop changes (for loading existing stories)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }

    lastEmittedHtmlRef.current = content
    pendingHtmlRef.current = content
  }, [content, editor])

  useEffect(() => {
    return () => {
      if (emitTimerRef.current) {
        clearTimeout(emitTimerRef.current)
      }
    }
  }, [])

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`border rounded-xl bg-background shadow-sm story-editor-wrapper ${className}`}>
      <Toolbar editor={editor} />
      <div className="relative">
        <BubbleToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      
      {/* Character and word count with autosave status */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground flex justify-between items-center">
        <div className="flex gap-4">
          <span>
            {editor.storage.characterCount.characters()} characters
          </span>
          <span>
            {editor.storage.characterCount.words()} words
          </span>
        </div>
        
        {/* Autosave status indicator */}
        {enableAutosave && storyId && (
          <div className="flex items-center gap-2" role="status" aria-live="polite" aria-atomic="true">
            {isSaving && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {!isSaving && lastSaved && !autosaveError && (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </span>
              </>
            )}
            {autosaveError && (
              <>
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Save failed - Retrying...</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
