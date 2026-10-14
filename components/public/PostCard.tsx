import Link from 'next/link'
import Image from 'next/image'
import { Leaf } from 'lucide-react'

export interface PostCardItem {
  id: string
  title: string
  slug: string
  featured_image_url?: string | null
  excerpt?: string | null
  preview?: string | null
}

interface PostCardProps {
  post: PostCardItem
  className?: string
}

export default function PostCard({ post, className = '' }: PostCardProps) {
  const previewText = (post.preview && post.preview.trim()) || (post.excerpt && post.excerpt.trim()) || ''

  return (
    <Link
      href={`/garden/${post.slug}`}
      className={`group flex flex-col h-full bg-white rounded-[5px] border border-[#F5ECDE] hover:border-[#F7D6CC] hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2 transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* 16:9 Image Area sitting flush at the top edge */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FDF3DC] shrink-0">
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 motion-reduce:group-hover:scale-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-[#FEF1ED] flex items-center justify-center">
            <Leaf className="w-8 h-8 text-[#CF3F29]/60" />
          </div>
        )}
      </div>

      {/* Title & Preview Area */}
      <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h2
            className="font-['MTN_Brighter_Sans',_sans-serif] text-[18px] sm:text-[20px] font-bold text-[#232536] leading-[1.3] group-hover:text-[#CF3F29] transition-colors line-clamp-1"
            title={post.title}
          >
            {post.title}
          </h2>
        </div>
        {previewText ? (
          <p className="text-xs text-[#5A5D70] leading-relaxed line-clamp-2 mt-2">
            {previewText}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
