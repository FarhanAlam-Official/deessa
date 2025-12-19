import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Eye, EyeOff, ExternalLink, Star } from "lucide-react"

async function getStories() {
  const supabase = await createClient()
  const { data } = await supabase.from("stories").select("*").order("created_at", { ascending: false })
  return data || []
}

export default async function StoriesPage() {
  const stories = await getStories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stories</h1>
          <p className="text-muted-foreground">Manage news and impact stories</p>
        </div>
        <Button asChild>
          <Link href="/admin/stories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Story
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Story</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No stories found. Write your first story.
                  </TableCell>
                </TableRow>
              ) : (
                stories.map((story) => (
                  <TableRow key={story.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {story.image && (
                          <img
                            src={story.image || "/placeholder.svg"}
                            alt={story.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{story.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{story.excerpt}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{story.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {story.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </TableCell>
                    <TableCell>
                      {story.is_published ? (
                        <Badge variant="default" className="bg-green-600">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {story.published_at
                        ? new Date(story.published_at).toLocaleDateString()
                        : new Date(story.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/stories/${story.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {story.is_published && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/stories`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
