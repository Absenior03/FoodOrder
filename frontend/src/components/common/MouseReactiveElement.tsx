import React, { useState, useRef, useEffect } from 'react';

interface MouseReactiveElementProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  magneticRadius?: number;
  tiltStrength?: number;
  glowIntensity?: number;
  scaleOnHover?: boolean;
}

export const MouseReactiveElement: React.FC<MouseReactiveElementProps> = ({
  children,
  className = '',
  intensity = 1,
  magneticRadius = 150,
  tiltStrength = 10,
  glowIntensity = 0.3,
  scaleOnHover = true,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isNearby, setIsNearby] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < magneticRadius) {
        setIsNearby(true);
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        setMousePosition({ x: relativeX, y: relativeY });
      } else {
        setIsNearby(false);
        setMousePosition({ x: rect.width / 2, y: rect.height / 2 });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [magneticRadius]);

  const getTiltTransform = () => {
    if (!elementRef.current || !isNearby) return '';

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (mousePosition.y - centerY) / centerY * -tiltStrength * intensity;
    const rotateY = (mousePosition.x - centerX) / centerX * tiltStrength * intensity;
    
    const scale = scaleOnHover && isHovered ? 1.05 : 1;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  };

  const getGlowStyle = () => {
    if (!isNearby) return {};
    
    return {
      background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, ${glowIntensity * intensity}), transparent)`,
    };
  };

  return (
    <div
      ref={elementRef}
      className={`relative transition-all duration-200 ease-out ${className}`}
      style={{
        transform: getTiltTransform(),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow overlay */}
      {isNearby && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60 rounded-inherit"
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