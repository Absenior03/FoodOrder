import React, { useState, useRef } from 'react';

interface GentleGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: 'subtle' | 'medium' | 'bright';
}

export const GentleGlow: React.FC<GentleGlowProps> = ({
  children,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.3)',
  intensity = 'medium',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!elementRef.current) return;
    
    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const getGlowStyle = () => {
    if (!isHovered) return {};

    const intensityMap = {
      subtle: 0.2,
      medium: 0.4,
      bright: 0.6,
    };

    const opacity = intensityMap[intensity];
    
    return {
      background: `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor.replace(/[\d.]+\)$/g, `${opacity})`)} 0%, transparent 70%)`,
    };
  };

  return (
    <div
      ref={elementRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Glow overlay */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={getGlowStyle()}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};