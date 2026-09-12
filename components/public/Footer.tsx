import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto font-sans text-sm text-gray-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="font-semibold text-gray-900">Ivan Kabandize</p>
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-black transition">
            Home
          </Link>
          <Link href="/services" className="hover:text-black transition">
            Services
          </Link>
          <Link href="/about" className="hover:text-black transition">
            About
          </Link>
          <Link href="/blog" className="hover:text-black transition">
            Articles
          </Link>
          <Link href="/auth/login" className="hover:text-black transition">
            Member Sign In
          </Link>
        </div>
      </div>
    </footer>
  )
}
