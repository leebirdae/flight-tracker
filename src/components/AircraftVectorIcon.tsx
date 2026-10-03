import React from 'react';

interface AircraftVectorIconProps {
  headingDeg?: number;
  className?: string;
  size?: number;
  color?: string;
  category?: string;
}

export const AircraftVectorIcon: React.FC<AircraftVectorIconProps> = ({
  headingDeg = 0,
  className = '',
  size = 24,
  color = 'currentColor',
  category = 'Narrow-body Jet',
}) => {
  const isHeavy = category.toLowerCase().includes('heavy') || category.toLowerCase().includes('wide');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `rotate(${headingDeg}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`inline-block shrink-0 ${className}`}
    >
      {/* Jet silhouette */}
      {isHeavy ? (
        // Wide-body heavy 4-engine / wide twin silhouette
        <path
          d="M32 4 C33.5 4 35 7 35 14 L35 23 L61 36 L61 40 L35 34 L35 50 L44 57 L44 60 L32 57 L20 60 L20 57 L29 50 L29 34 L3 40 L3 36 L29 23 L29 14 C29 7 30.5 4 32 4 Z"
          fill={color}
        />
      ) : (
        // Standard airliner silhouette
        <path
          d="M32 5 C33.2 5 34.5 7.5 34.5 15 L34.5 24 L58 37 L58 40.5 L34.5 34.5 L34.5 50 L42 56 L42 59 L32 56 L22 59 L22 56 L29.5 50 L29.5 34.5 L6 40.5 L6 37 L29.5 24 L29.5 15 C29.5 7.5 30.8 5 32 5 Z"
          fill={color}
        />
      )}
      {/* Fuselage center line accent */}
      <circle cx="32" cy="18" r="1.5" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
};
