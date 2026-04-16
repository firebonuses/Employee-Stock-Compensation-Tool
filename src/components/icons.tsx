// Lightweight inline SVG icons. Avoids adding lucide-react dependency.

interface IconProps {
  className?: string;
}

const base = "stroke-current";
const common = {
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Compass = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="15,9 11,11 9,15 13,13" fill="currentColor" stroke="none" />
  </svg>
);

export const LayoutDashboard = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const User = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
  </svg>
);

export const Briefcase = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M3 13h18" />
  </svg>
);

export const GitCompare = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <path d="M11 6h4a3 3 0 0 1 3 3v6" />
    <path d="M13 18H9a3 3 0 0 1-3-3V9" />
  </svg>
);

export const ListChecks = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M3 6l2 2 4-4" />
    <path d="M3 14l2 2 4-4" />
    <path d="M12 6h9" />
    <path d="M12 14h9" />
    <path d="M12 20h9" />
  </svg>
);

export const Info = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01" />
    <path d="M11 12h1v5h1" />
  </svg>
);

export const RotateCcw = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

export const Plus = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const Trash = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

export const Check = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export const ArrowUp = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

export const ArrowDown = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M12 5v14" />
    <path d="M5 12l7 7 7-7" />
  </svg>
);

export const Sparkle = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
  </svg>
);

export const TriangleAlert = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <path d="M10.3 3.86a2 2 0 0 1 3.4 0l8.05 13.46A2 2 0 0 1 20.04 20H3.96a2 2 0 0 1-1.71-2.68z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const Calendar = ({ className }: IconProps) => (
  <svg {...common} className={`${base} ${className ?? ""}`}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </svg>
);
