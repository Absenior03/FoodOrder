import React, { useState, useRef, useEffect } from 'react';

interface DynamicTextProps {
  children: React.ReactNode;
  className?: string;
  effect?: 'glow' | 'shimmer' | 'wave' | 'gradient-shift';
  intensity?: number;
  trackingRadius?: number;
}

export const DynamicText: React.FC<DynamicTextProps> = ({
  children,
  className = '',
  effect = 'glow',
  intensity = 1,
  trackingRadius = 200,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isNearby, setIsNearby] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;

      const rect = textRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < trackingRadius) {
        setIsNearby(true);
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        setMousePosition({ x: relativeX, y: relativeY });
      } else {
        setIsNearby(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [trackingRadius]);

  const getTextStyle = () => {
    if (!isNearby) return {};

    switch (effect) {
      case 'glow':
        return {
          textShadow: `0 0 ${20 * intensity}px currentColor, 0 0 ${40 * intensity}px currentColor`,
          filter: `brightness(${1 + 0.3 * intensity})`,
        };
      
      case 'shimmer':
        return {
          background: `linear-gradient(90deg, currentColor 0%, rgba(255,255,255,0.8) 50%, currentColor 100%)`,
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          animation: 'shimmer 2s ease-in-out infinite',
        };
      
      case 'wave':
        const waveOffset = Math.sin(Date.now() * 0.005) * 2 * intensity;
        return {
          transform: `translateY(${waveOffset}px)`,
          textShadow: `0 ${waveOffset}px ${10 * intensity}px rgba(0,0,0,0.3)`,
        };
      
      case 'gradient-shift':
        const hue = (mousePosition.x / (textRef.current?.offsetWidth || 1)) * 360;
        return {
          color: `hsl(${hue}, 70%, 50%)`,
          textShadow: `0 0 10px hsl(${hue + 30}, 70%, 60%), 0 0 20px hsl(${hue + 60}, 70%, 70%)`,
          transition: 'color 0.3s ease-out, text-shadow 0.3s ease-out',
        };
      
      default:
        return {};
    }
  };

  return (
    <div
      ref={textRef}
      className={`transition-all duration-300 ease-out ${className}`}
      style={getTextStyle()}
    >
      {children}
    </div>
  );
};