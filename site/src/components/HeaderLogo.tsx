import Link from 'next/link';

export default function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      {/* Icon */}
      <svg
        className="w-8 h-8 flex-shrink-0"
        viewBox="0 0 512 512"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="headerBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="headerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="512" height="512" rx="96" fill="#0f172a"/>
        <line x1="220" y1="150" x2="292" y2="150" stroke="#8B5CF6" strokeWidth="14" strokeLinecap="round" filter="url(#headerGlow)"/>
        <line x1="150" y1="220" x2="150" y2="292" stroke="#8B5CF6" strokeWidth="14" strokeLinecap="round" filter="url(#headerGlow)"/>
        <line x1="362" y1="220" x2="362" y2="292" stroke="#8B5CF6" strokeWidth="14" strokeLinecap="round" filter="url(#headerGlow)"/>
        <line x1="220" y1="362" x2="292" y2="362" stroke="#8B5CF6" strokeWidth="14" strokeLinecap="round" filter="url(#headerGlow)"/>
        <circle cx="220" cy="150" r="10" fill="#a78bfa"/>
        <circle cx="292" cy="150" r="10" fill="#a78bfa"/>
        <circle cx="150" cy="220" r="10" fill="#a78bfa"/>
        <circle cx="150" cy="292" r="10" fill="#a78bfa"/>
        <circle cx="362" cy="220" r="10" fill="#a78bfa"/>
        <circle cx="362" cy="292" r="10" fill="#a78bfa"/>
        <circle cx="220" cy="362" r="10" fill="#a78bfa"/>
        <circle cx="292" cy="362" r="10" fill="#a78bfa"/>
        <rect x="70" y="70" width="150" height="150" rx="24" fill="url(#headerBrandGrad)"/>
        <rect x="292" y="70" width="150" height="150" rx="24" fill="#ffffff"/>
        <rect x="70" y="292" width="150" height="150" rx="24" fill="#ffffff"/>
        <rect x="292" y="292" width="150" height="150" rx="24" fill="url(#headerBrandGrad)"/>
      </svg>
      {/* Text */}
      <span className="text-lg md:text-xl font-bold text-gradient group-hover:opacity-80 transition-opacity whitespace-nowrap">
        Jesse Eldridge
      </span>
    </Link>
  );
}
