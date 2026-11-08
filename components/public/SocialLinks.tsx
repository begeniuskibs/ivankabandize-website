import React from 'react'

export interface SocialLinksProps {
  variant?: 'dark' | 'cream'
  className?: string
}

export default function SocialLinks({ variant = 'dark', className = '' }: SocialLinksProps) {
  const isDark = variant === 'dark'

  const linkStyles = isDark
    ? 'text-[#FDF8F1] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#232536]'
    : 'text-[#232536] hover:text-[#CF3F29] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#232536] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDF8F1]'

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Instagram */}
      <a
        href="https://www.instagram.com/begeniuskibs/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ivan on Instagram"
        className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg transition ${linkStyles}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href="https://www.facebook.com/kbegenius/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ivan on Facebook"
        className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg transition ${linkStyles}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          aria-hidden="true"
          className="w-5 h-5"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href="https://www.linkedin.com/in/ivan-kabandize-68b4a4130/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ivan on LinkedIn"
        className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg transition ${linkStyles}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      </a>

      {/* Medium */}
      <a
        href="https://ivan-kabandize.medium.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ivan on Medium"
        className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg transition ${linkStyles}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
          aria-hidden="true"
          className="w-5 h-5"
        >
          <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
      </a>
    </div>
  )
}
