import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#232536] text-[#B8BAC9] py-14 mt-auto font-sans text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="font-['MTN_Brighter_Sans',_sans-serif] font-bold text-lg text-white">
            Ivan Kabandize<span className="text-[#EF5B45]">.</span>
          </p>
          <p className="text-[#8A8D9F] text-xs sm:text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
          <Link href="/workwithme" className="hover:text-white transition">
            Work with Me
          </Link>
          <Link href="/me" className="hover:text-white transition">
            Me
          </Link>
          <Link href="/garden" className="hover:text-white transition">
            The Garden
          </Link>
          <Link href="/now" className="hover:text-white transition">
            Now
          </Link>
          <Link href="/lets-talk" className="hover:text-white transition">
            Contact
          </Link>
          <Link href="/login" className="hover:text-white transition text-xs sm:text-sm text-[#EF5B45]">
            Sign-in
          </Link>
        </div>
      </div>
    </footer>
  )
}
