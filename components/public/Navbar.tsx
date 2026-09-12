import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:opacity-80 transition">
          Ivan Kabandize
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
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
          <Link
            href="/auth/login"
            className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-900 hover:border-black transition text-xs font-semibold"
          >
            Account
          </Link>
        </nav>
      </div>
    </header>
  )
}
