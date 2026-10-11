import React from 'react';

// Coin floral aquarelle discret (inspiré des 4 coins des affiches)
export function FloralCorner({
  className = '',
  position = 'top-left',
}: {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const rotationClass = {
    'top-left': '',
    'top-right': 'rotate-90',
    'bottom-right': 'rotate-180',
    'bottom-left': '-rotate-90',
  }[position];

  return (
    <div
      className={`pointer-events-none select-none absolute opacity-60 transition-opacity duration-300 ${rotationClass} ${className}`}
      aria-hidden="true"
    >
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
        {/* Tige principale courbée */}
        <path
          d="M 5 5 Q 35 15 65 50 Q 85 80 120 115"
          stroke="#4E6B5D"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />

        {/* Feuille eucalyptus vert sauge */}
        <path
          d="M 25 15 C 35 10 50 15 48 30 C 42 35 30 25 25 15 Z"
          fill="#87A287"
          fillOpacity="0.55"
        />

        {/* Feuille eucalyptus vert profond */}
        <path
          d="M 45 32 C 60 25 72 35 68 48 C 58 52 45 42 45 32 Z"
          fill="#4E6B5D"
          fillOpacity="0.5"
        />

        {/* Feuille vieux rose / prune */}
        <path
          d="M 68 55 C 85 45 95 60 88 72 C 78 75 65 65 68 55 Z"
          fill="#6E2D4A"
          fillOpacity="0.45"
        />

        {/* Feuille rose poudré */}
        <path
          d="M 85 75 C 102 68 112 80 106 94 C 95 96 82 86 85 75 Z"
          fill="#C87D88"
          fillOpacity="0.5"
        />

        {/* Baies dorées et mauves */}
        <circle cx="38" cy="22" r="3" fill="#D4AF37" fillOpacity="0.7" />
        <circle cx="58" cy="42" r="3.5" fill="#6E2D4A" fillOpacity="0.6" />
        <circle cx="80" cy="62" r="2.8" fill="#D4AF37" fillOpacity="0.75" />
        <circle cx="102" cy="85" r="3" fill="#87A287" fillOpacity="0.7" />

        {/* Éclats dorés */}
        <circle cx="118" cy="100" r="1.5" fill="#D4AF37" />
        <circle cx="65" cy="20" r="1.5" fill="#D4AF37" />
        <circle cx="15" cy="35" r="1.5" fill="#D4AF37" />
      </svg>
    </div>
  );
}

// Coup de pinceau aquarelle rose poudré / vieux rose sous les titres
export function WatercolorBrush({ className = '' }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 320 28"
        className="w-full h-auto opacity-70"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M 12 14 C 45 6 95 18 160 12 C 225 6 275 16 308 14 C 314 14 318 16 312 20 C 275 25 210 22 155 24 C 95 26 40 22 8 20 C 2 19 6 15 12 14 Z"
          fill="url(#brush-gradient)"
        />
        <defs>
          <linearGradient id="brush-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F3D8DA" stopOpacity="0.3" />
            <stop offset="30%" stopColor="#E8B4B8" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#C87D88" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F3D8DA" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Petit cœur dessiné à la main (identique aux cœurs dorés et roses des flyers)
export function HandDrawnHeart({
  className = '',
  color = 'gold',
  size = 18,
}: {
  className?: string;
  color?: 'gold' | 'rose' | 'plum';
  size?: number;
}) {
  const fillColors = {
    gold: '#D4AF37',
    rose: '#E8B4B8',
    plum: '#6E2D4A',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block ${className}`}
      aria-hidden="true"
    >
      <path
        d="M 12 7 C 9 3 4 4 4 8 C 4 13 11 18 12 19 C 13 18 20 13 20 8 C 20 4 15 3 12 7 Z"
        stroke={fillColors[color]}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color === 'rose' ? fillColors.rose : 'none'}
        fillOpacity={color === 'rose' ? 0.35 : 0}
      />
    </svg>
  );
}

// Séparateur délicat avec cœurs et branches
export function FloralDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 my-6 ${className}`}>
      <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-gold/40 to-gold/70" />
      <HandDrawnHeart color="gold" size={14} />
      <div className="h-[1px] w-16 bg-gradient-to-l from-transparent via-gold/40 to-gold/70" />
    </div>
  );
}
