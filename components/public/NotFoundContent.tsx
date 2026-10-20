import Link from 'next/link'

export default function NotFoundContent() {
  return (
    <>
      <style>{`
        .needle {
          transform-origin: 60px 60px;
          transform-box: view-box;
          animation: search 6s ease-in-out infinite;
        }
        @keyframes search {
          0% { transform: rotate(-70deg); }
          15% { transform: rotate(80deg); }
          30% { transform: rotate(-40deg); }
          45% { transform: rotate(50deg); }
          60% { transform: rotate(-15deg); }
          75% { transform: rotate(20deg); }
          100% { transform: rotate(-70deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .needle {
            animation: none;
            transform: rotate(25deg);
          }
        }
      `}</style>
      <section className="flex-1 flex items-center justify-center bg-[#FDF8F1] px-4 sm:px-6 py-20 sm:py-28 font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="flex justify-center">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              role="img"
              aria-label="A compass needle searching for north"
            >
              <circle cx="60" cy="60" r="54" fill="#fff" stroke="#F0E4D2" strokeWidth="4" />
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke="#F0E4D2"
                strokeWidth="1.5"
                strokeDasharray="2 6"
              />
              <g className="needle">
                <path d="M60 14 L70 60 L60 56 L50 60 Z" fill="#EF5B45" />
                <path d="M60 106 L70 60 L60 64 L50 60 Z" fill="#232536" />
              </g>
              <circle cx="60" cy="60" r="5" fill="#FDF8F1" stroke="#232536" strokeWidth="2" />
            </svg>
          </div>
          <p className="text-xs uppercase font-mono tracking-widest text-[#CF3F29] font-bold">
            404
          </p>
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#232536] tracking-tight leading-tight">
            This page has wandered off.
          </h1>
          <p className="text-base sm:text-lg text-[#5A5D70] leading-relaxed max-w-md mx-auto">
            The link you followed may be broken, or the page may have been moved or retired.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#CF3F29] hover:bg-[#b83420] text-[#FDF8F1] text-sm font-semibold transition active:scale-[0.98] shadow-sm text-center"
            >
              Go home
            </Link>
            <Link
              href="/garden"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-[#F0E4D2] hover:bg-[#FAF3E8] text-[#232536] text-sm font-semibold transition active:scale-[0.98] shadow-sm text-center"
            >
              Browse the Garden
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
