'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Youtube, CheckCircle2, XCircle, Plus, X } from 'lucide-react';
import { extractYouTubeId, fetchYouTubeMetadata, getYouTubeThumbnail, generateSlug } from '@/lib/utils/youtube';
import { notifications } from '@/lib/notifications';

interface PodcastFormProps {
  podcast?: any;
  mode: 'create' | 'edit';
}

const COMMON_TOPICS = [
  'Autism Awareness',
  'Inclusion',
  'Education',
  'Community',
  'Personal Stories',
  'Advocacy',
  'Mental Health',
  'Accessibility',
  'Family Support',
  'Employment',
  'Healthcare',
  'Technology',
];

export default function PodcastForm({ podcast, mode }: PodcastFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeSuccess, setYoutubeSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: podcast?.title || '',
    slug: podcast?.slug || '',
    description: podcast?.description || '',
    youtube_id: podcast?.youtube_id || '',
    thumbnail_url: podcast?.thumbnail_url || '',
    duration: podcast?.duration || '',
    format: podcast?.format || 'video',
    episode_number: podcast?.episode_number || '',
    topics: podcast?.topics || [],
    show_notes: podcast?.show_notes || '',
    key_topics: podcast?.key_topics || '',
    transcript: podcast?.transcript || '',
    highlights: podcast?.highlights || [],
    guest_name: podcast?.guest_name || '',
    guest_bio: podcast?.guest_bio || '',
    guest_photo_url: podcast?.guest_photo_url || '',
    guest_roles: podcast?.guest_roles || [],
    guest_social_linkedin: podcast?.guest_social_links?.linkedin || '',
    guest_social_twitter: podcast?.guest_social_links?.twitter || '',
    guest_social_facebook: podcast?.guest_social_links?.facebook || '',
    guest_social_instagram: podcast?.guest_social_links?.instagram || '',
    guest_social_email: podcast?.guest_social_links?.email || '',
    related_episode_ids: podcast?.related_episode_ids || [],
    featured: podcast?.featured || false,
    published: podcast?.published || false,
  });

  const [guestRoles, setGuestRoles] = useState<string[]>(podcast?.guest_roles || []);
  const [newRole, setNewRole] = useState('');

  const [highlights, setHighlights] = useState<string[]>(podcast?.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');

  const [showNotes, setShowNotes] = useState<Array<{title: string, content: string}>>(() => {
    if (podcast?.show_notes) {
      try {
        const parsed = JSON.parse(podcast.show_notes);
        return Array.isArray(parsed) ? parsed.slice(0, 5) : [{ title: 'Note 1', content: '' }];
      } catch {
        return [{ title: 'Note 1', content: podcast.show_notes }];
      }
    }
    return [{ title: 'Note 1', content: '' }];
  });

  const [customTopic, setCustomTopic] = useState('');

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !podcast) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.title),
      }));
    }
  }, [formData.title, podcast]);

  const handleYouTubeUrlChange = async (url: string) => {
    setYoutubeUrl(url);
    setYoutubeError('');
    setYoutubeSuccess(false);

    if (!url.trim()) return;

    const videoId = extractYouTubeId(url);

    if (!videoId) {
      setYoutubeError('Invalid YouTube URL');
      return;
    }

    setFetchingMetadata(true);

    try {
      const metadata = await fetchYouTubeMetadata(videoId);

      if (!metadata) {
        setYoutubeError('Could not fetch video metadata. Please check the URL.');
        setFetchingMetadata(false);
        return;
      }

      // Auto-fill form with YouTube data
      setFormData((prev) => ({
        ...prev,
        youtube_id: videoId,
        thumbnail_url: getYouTubeThumbnail(videoId, 'maxres'),
        title: prev.title || metadata.title,
      }));

      setYoutubeSuccess(true);
      notifications.showSuccess({
        title: 'YouTube video metadata loaded successfully',
        description: metadata.title,
      });
    } catch (error) {
      setYoutubeError('Failed to fetch video metadata.');
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleTopicToggle = (topic: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleAddCustomTopic = () => {
    if (customTopic.trim() && !formData.topics.includes(customTopic.trim())) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, customTopic.trim()],
      }));
      setCustomTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t !== topic),
    }));
  };

  const addShowNote = () => {
    if (showNotes.length < 5) {
      setShowNotes([...showNotes, { title: `Note ${showNotes.length + 1}`, content: '' }]);
    }
  };

  const removeShowNote = (index: number) => {
    setShowNotes(showNotes.filter((_, i) => i !== index));
  };

  const updateShowNote = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...showNotes];
    updated[index][field] = value;
    setShowNotes(updated);
  };

  const addGuestRole = () => {
    if (newRole.trim() && guestRoles.length < 3 && !guestRoles.includes(newRole.trim())) {
      setGuestRoles([...guestRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const removeGuestRole = (index: number) => {
    setGuestRoles(guestRoles.filter((_, i) => i !== index));
  };

  const addHighlight = () => {
    if (newHighlight.trim() && highlights.length < 10) {
      // Validate YouTube Shorts URL format
      const isValidShortUrl = /youtube\.com\/shorts\/|youtu\.be\//.test(newHighlight);
      if (!isValidShortUrl) {
        notifications.showError({
          title: 'Invalid URL',
          description: 'Please enter a valid YouTube Shorts URL',
        });
        return;
      }
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/admin/podcasts' : `/api/admin/podcasts/${podcast.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      // Filter out empty show notes
      const validShowNotes = showNotes.filter(note => note.content.trim());

      // Build guest social links object
      const guestSocialLinks = {
        linkedin: formData.guest_social_linkedin || undefined,
        twitter: formData.guest_social_twitter || undefined,
        facebook: formData.guest_social_facebook || undefined,
        instagram: formData.guest_social_instagram || undefined,
        email: formData.guest_social_email || undefined,
      };

      // Remove undefined values
      Object.keys(guestSocialLinks).forEach(key => 
        guestSocialLinks[key as keyof typeof guestSocialLinks] === undefined && delete guestSocialLinks[key as keyof typeof guestSocialLinks]
      );

      // Remove fields that don't exist in database (individual social links)
      const { 
        guest_social_linkedin, 
        guest_social_twitter, 
        guest_social_facebook,
        guest_social_instagram,
        guest_social_email,
        ...dbFields 
      } = formData;

      const payload = {
        ...dbFields,
        episode_number: formData.episode_number ? parseInt(formData.episode_number) : null,
        show_notes: validShowNotes.length > 0 ? JSON.stringify(validShowNotes) : null,
        guest_roles: guestRoles,
        guest_social_links: Object.keys(guestSocialLinks).length > 0 ? guestSocialLinks : null,
        highlights: highlights,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save podcast');
      }

      notifications.showSuccess({
        title: `Podcast ${mode === 'create' ? 'created' : 'updated'} successfully!`,
        description: 'Redirecting to podcasts list...',
      });

      router.push('/admin/podcasts');
      router.refresh();
    } catch (error) {
      notifications.showError({
        title: 'Failed to save podcast',
        description: 'Please try again or check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="guest">Guest</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>YouTube Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube URL *</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Youtube className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                    <Input
                      id="youtube_url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="pl-10"
                      disabled={fetchingMetadata}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleYouTubeUrlChange(youtubeUrl)}
                    disabled={!youtubeUrl || fetchingMetadata}
                  >
                    {fetchingMetadata ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Load'
                    )}
                  </Button>
                </div>
                {youtubeError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    {youtubeError}
                  </div>
                )}
                {youtubeSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Video loaded successfully!
                  </div>
                )}
              </div>

              {formData.thumbnail_url && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full max-w-md rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Episode Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-text-muted">
                  URL: /podcasts/{formData.slug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="episode_number">Episode Number</Label>
                  <Input
                    id="episode_number"
                    type="number"
                    value={formData.episode_number}
                    onChange={(e) =>
                      setFormData({ ...formData, episode_number: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 45:30"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="video"
                      checked={formData.format === 'video'}
                      onChange={(e) =>
                        setFormData({ ...formData, format: e.target.value })
                      }
                    />
                    <span>Video</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="audio"
                      checked={formData.format === 'audio'}
                      onChange={(e) =>
                        setFormData({ ...formData, format: e.target.value })
                      }
                    />
                    <span>Audio</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Topics</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_TOPICS.map((topic) => (
                    <Badge
                      key={topic}
                      variant={formData.topics.includes(topic) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleTopicToggle(topic)}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom topic"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTopic();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddCustomTopic} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <p className="text-sm font-medium w-full">Selected Topics:</p>
                    {formData.topics.map((topic) => (
                      <Badge key={topic} variant="default" className="gap-1">
                        {topic}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTopic(topic)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Show Notes (Up to 5 Notes)</CardTitle>
              <p className="text-sm text-muted-foreground">Organize your show notes into structured sections</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {showNotes.map((note, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder={`Note ${index + 1} Title`}
                      value={note.title}
                      onChange={(e) => updateShowNote(index, 'title', e.target.value)}
                      className="max-w-xs font-semibold"
                    />
                    {showNotes.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeShowNote(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Enter note content..."
                    value={note.content}
                    onChange={(e) => updateShowNote(index, 'content', e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
              
              {showNotes.length < 5 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addShowNote}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note ({showNotes.length}/5)
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Topics & Timestamps</CardTitle>
              <p className="text-sm text-muted-foreground">
                Format: HH:MM - Topic description (one per line)
                <br />
                Example: 02:15 - Community resilience strategies
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key_topics">Key Topics</Label>
                <Textarea
                  id="key_topics"
                  placeholder={"02:15 - Community resilience strategies in crisis management\\n08:42 - The psychological impact of displacement\\n15:30 - Sustainable infrastructure development"}
                  value={formData.key_topics}
                  onChange={(e) =>
                    setFormData({ ...formData, key_topics: e.target.value })
                  }
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Episode Highlights (YouTube Shorts)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add YouTube Shorts URLs that highlight key moments from this episode (max 10)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {highlights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {highlights.map((highlight, index) => {
                      // Extract video ID for thumbnail
                      const getVideoId = (url: string) => {
                        const patterns = [
                          /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
                          /youtu\.be\/([a-zA-Z0-9_-]+)/,
                        ];
                        for (const pattern of patterns) {
                          const match = url.match(pattern);
                          if (match) return match[1];
                        }
                        return null;
                      };
                      
                      const videoId = getVideoId(highlight);
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-brand-primary/30 transition-colors">
                          {/* Thumbnail Preview */}
                          {videoId && (
                            <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-gray-200">
                              <img
                                src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
                                alt={`Highlight ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded">
                                #{index + 1}
                              </span>
                              <p className="text-xs text-gray-500">YouTube Short</p>
                            </div>
                            <p className="text-xs text-gray-600 truncate" title={highlight}>
                              {highlight}
                            </p>
                          </div>
                          
                          {/* Remove Button */}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeHighlight(index)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {highlights.length < 10 && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/shorts/... or https://youtu.be/..."
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addHighlight();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={addHighlight}
                        variant="outline"
                        disabled={!newHighlight.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📊 {highlights.length}/10 highlights • Press Enter to add quickly
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Full Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript</Label>
                <Textarea
                  id="transcript"
                  value={formData.transcript}
                  onChange={(e) =>
                    setFormData({ ...formData, transcript: e.target.value })
                  }
                  rows={12}
                  placeholder="Full episode transcript with speaker names and timestamps..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guest Tab */}
        <TabsContent value="guest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest_name">Guest Name</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_name: e.target.value })
                  }
                  placeholder="Dr. Jane Smith"
                />
              </div>

              <div className="space-y-2">
                <Label>Guest Roles (Max 3)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g., Teacher, Scholar, Community Worker"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuestRole())}
                  />
                  <Button 
                    type="button" 
                    onClick={addGuestRole}
                    disabled={guestRoles.length >= 3 || !newRole.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {guestRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {guestRoles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary"
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => removeGuestRole(index)}
                          className="ml-2 hover:text-brand-primary-dark"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {guestRoles.length}/3 roles added
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_bio">Guest Bio (Recommended: ~35 words)</Label>
                <Textarea
                  id="guest_bio"
                  value={formData.guest_bio}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_bio: e.target.value })
                  }
                  rows={4}
                  placeholder="A brief bio about the guest..."
                />
                <p className="text-xs text-muted-foreground">
                  {formData.guest_bio.split(/\s+/).filter(Boolean).length} words
                  {formData.guest_bio.split(/\s+/).filter(Boolean).length > 35 && 
                    <span className="text-yellow-600 ml-1">(Consider shortening to ~35 words)</span>
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_photo_url">Guest Photo URL</Label>
                <Input
                  id="guest_photo_url"
                  type="url"
                  value={formData.guest_photo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_photo_url: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {formData.guest_photo_url && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <img
                    src={formData.guest_photo_url}
                    alt="Guest"
                    className="w-32 h-32 rounded-full object-cover border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <p className="text-sm text-muted-foreground">Add guest's social media profiles</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest_social_linkedin">LinkedIn</Label>
                <Input
                  id="guest_social_linkedin"
                  type="url"
                  value={formData.guest_social_linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_social_linkedin: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_social_twitter">X (Twitter)</Label>
                <Input
                  id="guest_social_twitter"
                  type="url"
                  value={formData.guest_social_twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_social_twitter: e.target.value })
                  }
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_social_facebook">Facebook</Label>
                <Input
                  id="guest_social_facebook"
                  type="url"
                  value={formData.guest_social_facebook}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_social_facebook: e.target.value })
                  }
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_social_instagram">Instagram</Label>
                <Input
                  id="guest_social_instagram"
                  type="url"
                  value={formData.guest_social_instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_social_instagram: e.target.value })
                  }
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_social_email">Email</Label>
                <Input
                  id="guest_social_email"
                  type="email"
                  value={formData.guest_social_email}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_social_email: e.target.value })
                  }
                  placeholder="guest@example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visibility & Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, published: checked as boolean })
                  }
                />
                <Label htmlFor="published" className="cursor-pointer">
                  Published (visible to public)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, featured: checked as boolean })
                  }
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured (show in hero section)
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={loading || !formData.title || !formData.slug || !formData.youtube_id}
          className="bg-brand-primary hover:bg-brand-primary-dark"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Podcast'
          ) : (
            'Update Podcast'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
