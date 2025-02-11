export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect width="32" height="32" rx="8" fill="url(#gradient)" />
      
      {/* Kanban columns */}
      <rect x="8" y="8" width="4" height="16" rx="2" fill="white" fillOpacity="0.9"/>
      <rect x="14" y="8" width="4" height="16" rx="2" fill="white" fillOpacity="0.7"/>
      <rect x="20" y="8" width="4" height="16" rx="2" fill="white" fillOpacity="0.5"/>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#646cff"/>
          <stop offset="100%" stopColor="#9c9eff"/>
        </linearGradient>
      </defs>
    </svg>
  );
} 