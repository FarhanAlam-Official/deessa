export type MediaType = 'image' | 'video' | 'document'

export interface MediaDimensions {
  width?: number
  height?: number
  duration?: number // for videos in seconds
}

export interface MediaUsageLocation {
  page: string
  section: string
  field: string
  label?: string
}

export interface MediaAsset {
  id: string
  filename: string
  bucket: string
  storage_path: string
  url: string
  type: MediaType
  mime_type: string | null
  size_bytes: number | null
  dimensions: MediaDimensions | null
  alt_text: string | null
  caption: string | null
  tags: string[] | null
  uploaded_by: string | null
  usage_locations: MediaUsageLocation[]
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreateMediaAssetInput {
  filename: string
  bucket: string
  storage_path: string
  url: string
  type: MediaType
  mime_type?: string
  size_bytes?: number
  dimensions?: MediaDimensions
  alt_text?: string
  caption?: string
  tags?: string[]
}

export interface UpdateMediaAssetInput {
  alt_text?: string
  caption?: string
  tags?: string[]
  usage_locations?: MediaUsageLocation[]
}

export interface MediaLibraryFilters {
  type?: MediaType
  bucket?: string
  search?: string
  tags?: string[]
  startDate?: string
  endDate?: string
}

export interface MediaLibraryStats {
  total_count: number
  total_size_bytes: number
  images_count: number
  videos_count: number
  documents_count: number
}

export interface HomepageContent {
  // Hero Section
  hero: {
    video?: {
      url: string
      thumbnail?: string
      autoplay: boolean
      loop: boolean
      muted: boolean
      showControls: boolean
    }
    mainImage?: string
    classroomImage?: string
    donorImage1?: string
    donorImage2?: string
    videoImage?: string
    title: string
    subtitle: string
    badge: string
    ctaButton: {
      text: string
      link: string
    }
    secondaryButton?: {
      text: string
      link: string
    }
  }
  
  // Initiative Cards
  initiatives: {
    education: {
      title: string
      description: string
      image: string
      link?: string
      stats?: {
        label: string
        value: string
      }
    }
    empowerment: {
      title: string
      description: string
      image: string
      link?: string
      stats?: {
        label: string
        value: string
      }
    }
    health: {
      title: string
      description: string
      image: string
      link?: string
      stats?: {
        label: string
        value: string
      }
    }
  }
  
  // Stats Section
  stats?: {
    enabled: boolean
    backgroundColor?: string
    stats: Array<{
      label: string
      value: string
      icon?: string
    }>
  }
  
  // Call to Action Section
  cta?: {
    enabled: boolean
    title: string
    description: string
    backgroundImage?: string
    buttons: Array<{
      text: string
      link: string
      variant: 'primary' | 'secondary'
    }>
  }
}
