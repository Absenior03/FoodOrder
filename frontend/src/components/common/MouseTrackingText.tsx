import React, { useState, useRef, useEffect } from 'react';

interface MouseTrackingTextProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowIntensity?: number;
  trackingRadius?: number;
  scaleOnHover?: boolean;
}

export const MouseTrackingText: React.FC<MouseTrackingTextProps> = ({
  children,
  className = '',
  glowColor = 'currentColor',
  glowIntensity = 1,
  trackingRadius = 150,
  scaleOnHover = false,
}) => {
  const [mouseDistance, setMouseDistance] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
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
      
      const normalizedDistance = Math.max(0, Math.min(1, distance / trackingRadius));
      setMouseDistance(normalizedDistance);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [trackingRadius]);

  const getGlowIntensity = () => {
    return (1 - mouseDistance) * glowIntensity;
  };

  const getTextStyle = () => {
    const intensity = getGlowIntensity();
    const scale = scaleOnHover && isHovered ? 1.05 : 1;
    
    return {
      textShadow: `
        0 0 ${10 * intensity}px ${glowColor},
        0 0 ${20 * intensity}px ${glowColor},
        0 0 ${30 * intensity}px ${glowColor}
      `,
      filter: `brightness(${1 + intensity * 0.3}) contrast(${1 + intensity * 0.2})`,
      transform: `scale(${scale})`,
      transition: 'all 0.3s ease-out',
    };
  };

  return (
    <div
      ref={textRef}
      className={className}
      style={getTextStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};