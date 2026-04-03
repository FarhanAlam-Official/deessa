"use client"

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import type { Editor } from "@tiptap/react"
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Table,
  Trash2,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
  Video,
  Columns,
  AlertCircle,
  Sparkles,
  Type,
} from "lucide-react"

export interface SlashCommand {
  title: string
  description: string
  icon: React.ReactNode
  category: "Text" | "Media" | "Layout"
  command: (editor: Editor) => void
  searchTerms?: string[]
}

export interface SlashMenuProps {
  editor: Editor
  query: string
  onSelect: (command: SlashCommand) => void
}

export interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ editor, query, onSelect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Define all available commands
    const allCommands: SlashCommand[] = [
      // Text commands
      {
        title: "Paragraph",
        description: "Switch back to normal paragraph text",
        icon: <Type className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().setParagraph().run(),
        searchTerms: ["paragraph", "normal", "text", "body"],
      },
      {
        title: "Heading 1",
        description: "Large section heading",
        icon: <Heading1 className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        searchTerms: ["h1", "heading", "title"],
      },
      {
        title: "Heading 2",
        description: "Medium section heading",
        icon: <Heading2 className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        searchTerms: ["h2", "heading", "subtitle"],
      },
      {
        title: "Heading 3",
        description: "Small section heading",
        icon: <Heading3 className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        searchTerms: ["h3", "heading", "subheading"],
      },
      {
        title: "Heading 4",
        description: "Tiny section heading",
        icon: <Heading4 className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
        searchTerms: ["h4", "heading"],
      },
      {
        title: "Bullet List",
        description: "Create a bullet list",
        icon: <List className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
        searchTerms: ["ul", "unordered", "list", "bullet"],
      },
      {
        title: "Numbered List",
        description: "Create a numbered list",
        icon: <ListOrdered className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
        searchTerms: ["ol", "ordered", "list", "numbered"],
      },
      {
        title: "Blockquote",
        description: "Insert a quote",
        icon: <Quote className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
        searchTerms: ["quote", "blockquote", "citation"],
      },
      {
        title: "Horizontal Rule",
        description: "Insert a divider line",
        icon: <Minus className="h-4 w-4" />,
        category: "Text",
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
        searchTerms: ["hr", "divider", "line", "separator"],
      },

      // Media commands
      {
        title: "Image",
        description: "Upload or embed an image",
        icon: <ImageIcon className="h-4 w-4" />,
        category: "Media",
        command: (editor) => {
          // This will be handled by opening the image dialog
          // For now, we'll just focus the editor
          editor.chain().focus().run()
        },
        searchTerms: ["image", "img", "photo", "picture"],
      },
      {
        title: "Video",
        description: "Embed a YouTube video",
        icon: <Video className="h-4 w-4" />,
        category: "Media",
        command: (editor) => {
          // This will be handled by opening the video dialog
          editor.chain().focus().run()
        },
        searchTerms: ["video", "youtube", "embed"],
      },

      // Layout commands
      {
        title: "Table",
        description: "Insert a 3x3 table",
        icon: <Table className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        searchTerms: ["table", "grid", "rows", "columns"],
      },
      {
        title: "Two Column",
        description: "Create a two-column layout",
        icon: <Columns className="h-4 w-4" />,
        category: "Layout",
        command: (editor) =>
          editor.chain().focus().setTwoColumn({ leftContent: "", rightContent: "" }).run(),
        searchTerms: ["columns", "two", "layout", "split"],
      },
      {
        title: "Callout (Info)",
        description: "Insert an info callout",
        icon: <AlertCircle className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().setCallout("info").run(),
        searchTerms: ["callout", "info", "note", "box"],
      },
      {
        title: "Callout (Warning)",
        description: "Insert a warning callout",
        icon: <AlertCircle className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().setCallout("warning").run(),
        searchTerms: ["callout", "warning", "alert", "caution"],
      },
      {
        title: "Callout (Success)",
        description: "Insert a success callout",
        icon: <AlertCircle className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().setCallout("success").run(),
        searchTerms: ["callout", "success", "tip", "check"],
      },
      {
        title: "Highlight Quote",
        description: "Insert a highlighted quote",
        icon: <Sparkles className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().setHighlightQuote().run(),
        searchTerms: ["quote", "highlight", "pullquote", "featured"],
      },
      {
        title: "Divider",
        description: "Insert a visual divider",
        icon: <Minus className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().setHorizontalRule().run(),
        searchTerms: ["divider", "separator", "break"],
      },
      {
        title: "Delete Table",
        description: "Remove the table at the cursor",
        icon: <Trash2 className="h-4 w-4" />,
        category: "Layout",
        command: (editor) => editor.chain().focus().deleteTable().run(),
        searchTerms: ["delete", "remove", "table", "drop"],
      },
    ]

    // Filter commands based on query
    const filteredCommands = query
      ? allCommands.filter((command) => {
          const searchText = query.toLowerCase()
          return (
            command.title.toLowerCase().includes(searchText) ||
            command.description.toLowerCase().includes(searchText) ||
            command.searchTerms?.some((term) => term.includes(searchText))
          )
        })
      : allCommands

    // Group commands by category
    const groupedCommands = filteredCommands.reduce(
      (acc, command) => {
        if (!acc[command.category]) {
          acc[command.category] = []
        }
        acc[command.category].push(command)
        return acc
      },
      {} as Record<string, SlashCommand[]>
    )

    // Reset selected index when filtered commands change
    useEffect(() => {
      setSelectedIndex(0)
    }, [query])

    // Keyboard navigation handler
    const onKeyDown = useCallback(
      (event: KeyboardEvent): boolean => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1))
          return true
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0))
          return true
        }

        if (event.key === "Enter") {
          const command = filteredCommands[selectedIndex]
          if (command) {
            onSelect(command)
          }
          return true
        }

        if (event.key === "Escape") {
          return true
        }

        return false
      },
      [filteredCommands, selectedIndex, onSelect]
    )

    // Expose keyboard handler to parent
    useImperativeHandle(ref, () => ({
      onKeyDown,
    }))

    if (filteredCommands.length === 0) {
      return (
        <div className="bg-popover border rounded-md shadow-md p-4 text-sm text-muted-foreground">
          No commands found
        </div>
      )
    }

    let currentIndex = 0

    return (
      <div className="bg-popover border rounded-md shadow-md overflow-hidden max-h-[400px] overflow-y-auto">
        {Object.entries(groupedCommands).map(([category, commands]) => (
          <div key={category}>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">
              {category}
            </div>
            {commands.map((command) => {
              const index = currentIndex++
              const isSelected = index === selectedIndex

              return (
                <button
                  key={command.title}
                  type="button"
                  className={`w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                    isSelected ? "bg-accent" : ""
                  }`}
                  onClick={() => onSelect(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="mt-0.5 text-muted-foreground">{command.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{command.title}</div>
                    <div className="text-xs text-muted-foreground">{command.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }
)

SlashMenu.displayName = "SlashMenu"
