import Link from 'next/link'
import { Leaf } from 'lucide-react'

export interface PostCardItem {
  id: string
  title: string
  slug: string
  featured_image_url?: string | null
  excerpt?: string | null
  preview?: string | null
}

// Configurable line clamping constant: edit this number to change title line display count
export const CARD_TITLE_LINES = 1

interface PostCardProps {
  post: PostCardItem
  className?: string
  showPreview?: boolean
}

export default function PostCard({ post, className = '', showPreview = true }: PostCardProps) {
  const titleClass =
    CARD_TITLE_LINES === 1
      ? 'whitespace-nowrap overflow-hidden text-ellipsis'
      : `overflow-hidden text-ellipsis line-clamp-${CARD_TITLE_LINES}`

  const previewText = (post.preview && post.preview.trim()) || (post.excerpt && post.excerpt.trim()) || ''

  return (
    <Link
      href={`/garden/${post.slug}`}
      className={`group flex flex-col h-full bg-white rounded-[5px] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2 ${className}`}
    >
      {/* 16:9 Image Area sitting flush at the top edge */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FDF3DC] shrink-0">
        {post.featured_image_url ? (
          <img
            src={post.featured_image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${showPreview ? 'bg-[#FEF1ED]' : ''}`}>
            {showPreview ? (
              <Leaf className="w-8 h-8 text-[#CF3F29]/60" />
            ) : (
              <Leaf className="w-10 h-10 text-[#1F7A72]" />
            )}
          </div>
        )}
      </div>

      {/* Title Area with 16px top, 20px horizontal & bottom padding */}
      <div
        className={
          showPreview && previewText
            ? 'p-5 flex-1 flex flex-col justify-between min-w-0'
            : 'pt-4 px-5 pb-5 flex-1 flex flex-col justify-center min-w-0'
        }
      >
        <div>
          <h2
            className={`font-['MTN_Brighter_Sans',_sans-serif] text-[20px] font-bold text-[#232536] leading-[1.3] group-hover:text-[#EF5B45] transition-colors ${showPreview ? 'line-clamp-1' : titleClass}`}
            title={post.title}
          >
            {post.title}
          </h2>
        </div>
        {showPreview && previewText ? (
          <p className="text-xs text-[#5A5D70] leading-relaxed line-clamp-2 mt-2">
            {previewText}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
