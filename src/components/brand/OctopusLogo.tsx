import React from 'react';

interface OctopusLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'plum';
}

export default function OctopusLogo({
  className = '',
  size = 48,
  showText = false,
  variant = 'plum',
}: OctopusLogoProps) {
  const colorMap = {
    light: '#FAF6F0',
    dark: '#2D2327',
    plum: '#6E2D4A',
  };

  const strokeColor = colorMap[variant] || '#6E2D4A';
  const heartColor = '#E8B4B8';
  const goldColor = '#D4AF37';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105 select-none"
      >
        {/* Rayons de joie autour de la tête */}
        <line x1="28" y1="28" x2="20" y2="24" stroke={goldColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="28" x2="80" y2="24" stroke={goldColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="12" x2="50" y2="6" stroke={goldColor} strokeWidth="3" strokeLinecap="round" />

        {/* Tête de pieuvre ronde et douce */}
        <path
          d="M 50 18 C 30 18 26 34 26 48 C 26 55 30 62 36 64 C 40 65 44 65 50 65 C 56 65 60 65 64 64 C 70 62 74 55 74 48 C 74 34 70 18 50 18 Z"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Petits yeux fermés de bonheur / souriants */}
        <path d="M 39 42 Q 43 45 47 42" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        <path d="M 53 42 Q 57 45 61 42" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />

        {/* Petit cœur rose sur le front */}
        <path
          d="M 50 49 C 48 46 44 47 44 50 C 44 53 50 56 50 56 C 50 56 56 53 56 50 C 56 47 52 46 50 49 Z"
          fill={heartColor}
          stroke={strokeColor}
          strokeWidth="1.2"
        />

        {/* Tentacules bouclées emblématiques du flyer */}
        {/* Tentacule 1 gauche externe */}
        <path
          d="M 28 58 C 22 62 16 70 18 78 C 20 84 27 82 26 76 C 25 71 32 68 36 67"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Tentacule 2 gauche interne */}
        <path
          d="M 36 65 C 32 72 30 82 36 86 C 41 89 45 82 43 76 C 42 70 45 67 48 66"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Tentacule 3 droite interne */}
        <path
          d="M 64 65 C 68 72 70 82 64 86 C 59 89 55 82 57 76 C 58 70 55 67 52 66"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Tentacule 4 droite externe */}
        <path
          d="M 72 58 C 78 62 84 70 82 78 C 80 84 73 82 74 76 C 75 71 68 68 64 67"
          stroke={strokeColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span
            className="font-script text-2xl leading-none tracking-wide"
            style={{ color: strokeColor }}
          >
            L&apos;Atelier
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase font-medium text-plum/80 font-sans mt-0.5">
            Les P&apos;tites Créa de Claire
          </span>
          <span className="text-[9px] tracking-[0.15em] text-sage font-medium uppercase">
            Port-la-Nouvelle
          </span>
        </div>
      )}
    </div>
  );
}
