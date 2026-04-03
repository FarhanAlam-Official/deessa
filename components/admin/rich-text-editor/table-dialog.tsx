"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface TableDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (config: { rows: number; cols: number; withHeaderRow: boolean }) => void
}

export function TableDialog({ isOpen, onClose, onInsert }: TableDialogProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [withHeaderRow, setWithHeaderRow] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setRows(3)
      setCols(3)
      setWithHeaderRow(true)
    }
  }, [isOpen])

  const handleInsert = () => {
    const nextRows = Math.max(1, Math.min(20, Number(rows) || 3))
    const nextCols = Math.max(1, Math.min(10, Number(cols) || 3))

    onInsert({
      rows: nextRows,
      cols: nextCols,
      withHeaderRow,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
          <DialogDescription>
            Choose the table size. You can add or remove rows and columns later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="table-rows">Rows</Label>
              <Input
                id="table-rows"
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(event) => setRows(Number(event.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-cols">Columns</Label>
              <Input
                id="table-cols"
                type="number"
                min={1}
                max={10}
                value={cols}
                onChange={(event) => setCols(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="table-header" className="cursor-pointer">
              Include header row
            </Label>
            <Switch
              id="table-header"
              checked={withHeaderRow}
              onCheckedChange={setWithHeaderRow}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleInsert}>
            Insert Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
