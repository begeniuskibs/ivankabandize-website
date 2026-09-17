import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#FDF8F1]/90 backdrop-blur-md border-b border-[#F5ECDE] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo / Wordmark with trailing dot */}
        <Link
          href="/"
          className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#232536] hover:opacity-90 transition flex items-baseline"
        >
          <span>Ivan Kabandize</span>
          <span className="text-[#EF5B45] text-2xl sm:text-[26px] font-extrabold">.</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-sm sm:text-[15px] font-semibold text-[#5A5D70]">
          <Link href="/services" className="hover:text-[#232536] transition">
            Work with Me
          </Link>
          <Link href="/about" className="hover:text-[#232536] transition">
            Me
          </Link>
          <Link href="/garden" className="hover:text-[#232536] transition">
            The Garden
          </Link>
          <Link href="/now" className="hover:text-[#232536] transition">
            Now
          </Link>
          <Link
            href="/auth/login"
            className="text-[#EF5B45] hover:text-[#D94834] transition"
          >
            Sign-in
          </Link>
        </nav>
      </div>
    </header>
  )
}
