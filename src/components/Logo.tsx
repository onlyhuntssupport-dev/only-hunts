import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const KuduLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", ...props }) => {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Amber Gradient for the Horns */}
        <linearGradient id="amber-horn-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#EA580C" /> {/* orange-600 */}
          <stop offset="100%" stopColor="#F97316" /> {/* orange-500 */}
        </linearGradient>
      </defs>

      {/* Horns: Using the amber gradient. 
        Styled as a sleek, continuous geometric curve.
      */}
      <path
        d="M42 45 C30 15 10 25 15 5 C30 15 45 -5 50 40 C55 -5 70 15 85 5 C90 25 70 15 58 45 Z"
        fill="url(#amber-horn-gradient)"
      />

      {/* Skull Base: Responsive to Light/Dark mode via Tailwind classes.
        Geometric, low-poly aesthetic.
      */}
      <path
        d="M50 115 L35 80 L25 50 L42 45 L50 55 L58 45 L75 50 L65 80 Z"
        className="fill-kalahari dark:fill-off-white transition-colors duration-300"
      />
      
      {/* Eye Sockets / Details (Optional cutouts or dark accents) */}
      <polygon points="35,60 42,55 42,65" className="fill-olive dark:fill-background" />
      <polygon points="65,60 58,55 58,65" className="fill-olive dark:fill-background" />
      <line x1="50" y1="55" x2="50" y2="100" stroke="currentColor" strokeWidth="1" className="text-olive dark:text-background" />
    </svg>
  );
};

export default KuduLogo;