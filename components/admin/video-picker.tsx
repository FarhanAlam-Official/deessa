"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Video, Check, Upload, Link as LinkIcon, Settings2 } from "lucide-react"
import { MediaPicker } from "./media-picker"
import type { MediaAsset } from "@/lib/types/media"

interface VideoSettings {
  url: string
  thumbnail?: string
  autoplay: boolean
  loop: boolean
  muted: boolean
  showControls: boolean
}

interface VideoPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (settings: VideoSettings) => void
  currentSettings?: VideoSettings
  bucket?: string
}

export function VideoPicker({
  open,
  onOpenChange,
  onSelect,
  currentSettings,
  bucket = "hero-videos",
}: VideoPickerProps) {
  const [videoUrl, setVideoUrl] = useState(currentSettings?.url || "")
  const [thumbnail, setThumbnail] = useState(currentSettings?.thumbnail || "")
  const [autoplay, setAutoplay] = useState(currentSettings?.autoplay ?? true)
  const [loop, setLoop] = useState(currentSettings?.loop ?? true)
  const [muted, setMuted] = useState(currentSettings?.muted ?? true)
  const [showControls, setShowControls] = useState(currentSettings?.showControls ?? false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false)
  const [pickerType, setPickerType] = useState<"video" | "thumbnail">("video")

  function handleMediaSelect(url: string, asset?: MediaAsset) {
    if (pickerType === "video") {
      setVideoUrl(url)
      // Try to set dimensions if available
      if (asset?.dimensions?.width && asset?.dimensions?.height) {
        console.log("Video dimensions:", asset.dimensions)
      }
    } else {
      setThumbnail(url)
    }
  }

  function handleSave() {
    if (!videoUrl) return

    const settings: VideoSettings = {
      url: videoUrl,
      thumbnail: thumbnail || undefined,
      autoplay,
      loop,
      muted,
      showControls,
    }

    onSelect(settings)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Video className="h-5 w-5" />
              Configure Hero Video
            </DialogTitle>
            <DialogDescription>
              Upload a video or paste a URL, and configure playback settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Video Selection */}
            <div className="space-y-3">
              <Label>Video File</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPickerType("video")
                    setShowMediaPicker(true)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: MP4, WebM, OGG • Recommended: 1920×1080 (Full HD)
              </p>
            </div>

            {/* Video Preview */}
            {videoUrl && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium mb-3">Preview</p>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      poster={thumbnail}
                      autoPlay={autoplay}
                      loop={loop}
                      muted={muted}
                      controls={showControls}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thumbnail Selection */}
            <div className="space-y-3">
              <Label>Thumbnail Image (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPickerType("thumbnail")
                    setShowThumbnailPicker(true)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Shown before video loads or on mobile devices
              </p>
            </div>

            {/* Playback Settings */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Playback Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoplay" className="text-sm font-medium">
                        Autoplay
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Start playing automatically when page loads
                      </p>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={autoplay}
                      onCheckedChange={setAutoplay}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="loop" className="text-sm font-medium">
                        Loop
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Repeat video continuously
                      </p>
                    </div>
                    <Switch id="loop" checked={loop} onCheckedChange={setLoop} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="muted" className="text-sm font-medium">
                        Muted
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Play without sound (required for autoplay in most browsers)
                      </p>
                    </div>
                    <Switch id="muted" checked={muted} onCheckedChange={setMuted} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="controls" className="text-sm font-medium">
                        Show Controls
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Display play/pause and volume controls
                      </p>
                    </div>
                    <Switch
                      id="controls"
                      checked={showControls}
                      onCheckedChange={setShowControls}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Performance Tips
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Keep video files under 50MB for faster loading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Use MP4 format with H.264 codec for best compatibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Compress videos before uploading using tools like HandBrake</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Consider showing a static image on mobile to save bandwidth</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!videoUrl}>
              <Check className="h-4 w-4 mr-2" />
              Save Video Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Picker for Video */}
      <MediaPicker
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleMediaSelect}
        currentUrl={videoUrl}
        bucket={bucket}
        accept="video/*"
        mediaType="video"
        maxSizeMB={50}
        title="Select Video"
        description="Choose a video from library or upload a new one"
      />

      {/* Media Picker for Thumbnail */}
      <MediaPicker
        open={showThumbnailPicker}
        onOpenChange={setShowThumbnailPicker}
        onSelect={handleMediaSelect}
        currentUrl={thumbnail}
        bucket="hero-images"
        accept="image/*"
        mediaType="image"
        maxSizeMB={5}
        title="Select Thumbnail"
        description="Choose a thumbnail image for the video"
      />
    </>
  )
}
