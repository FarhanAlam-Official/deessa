"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle } from "lucide-react"
import { createImpactStat, updateImpactStat } from "@/lib/actions/admin-stats"
import type { ImpactStat } from "@/lib/types/admin"

interface StatFormProps {
  stat?: ImpactStat
}

const iconOptions = [
  { value: "school", label: "School" },
  { value: "groups", label: "Groups/People" },
  { value: "location", label: "Location" },
  { value: "heart", label: "Heart" },
  { value: "medical", label: "Medical" },
  { value: "home", label: "Home" },
  { value: "chart", label: "Chart" },
  { value: "dollar", label: "Dollar" },
]

const colorOptions = [
  { value: "#ef4444", label: "Red" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
]

export function StatForm({ stat }: StatFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState(stat?.category || "home")
  const [icon, setIcon] = useState(stat?.icon || "")
  const [color, setColor] = useState(stat?.color || "")
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    formData.set("category", category)
    formData.set("icon", icon)
    formData.set("color", color)

    const result = stat ? await updateImpactStat(stat.id, formData) : await createImpactStat(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      router.push("/admin/stats")
      router.refresh()
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    name="label"
                    defaultValue={stat?.label}
                    placeholder="e.g., Schools Built"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    name="value"
                    defaultValue={stat?.value}
                    placeholder="e.g., 50+ or 12,450"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Display Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Homepage</SelectItem>
                      <SelectItem value="impact">Impact Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress Percentage (optional)</Label>
                  <Input
                    id="progress"
                    name="progress"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={stat?.progress ?? ""}
                    placeholder="e.g., 85"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded" style={{ backgroundColor: opt.value }} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPublished">Show on Website</Label>
                <Switch id="isPublished" name="isPublished" defaultChecked={stat?.is_published ?? true} value="true" />
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, this statistic will be visible on the selected page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: color ? `${color}10` : "#f1f5f9" }}>
                <p className="text-3xl font-bold" style={{ color: color || "#1e293b" }}>
                  {stat?.value || "50+"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat?.label || "Label"}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {stat ? "Save Changes" : "Add Stat"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
