import React, { useState, useRef } from 'react';

interface SubtleHoverProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  effect?: 'lift' | 'glow' | 'scale' | 'tilt';
}

export const SubtleHover: React.FC<SubtleHoverProps> = ({
  children,
  className = '',
  intensity = 'medium',
  effect = 'lift',
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

  const getTransform = () => {
    if (!isHovered) return '';

    const intensityMap = {
      light: 0.5,
      medium: 1,
      strong: 1.5,
    };

    const factor = intensityMap[intensity];

    switch (effect) {
      case 'lift':
        return `translateY(-${2 * factor}px)`;
      case 'scale':
        return `scale(${1 + 0.02 * factor})`;
      case 'tilt':
        if (!elementRef.current) return '';
        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (mousePosition.y - centerY) / centerY * -2 * factor;
        const rotateY = (mousePosition.x - centerX) / centerX * 2 * factor;
        return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      default:
        return '';
    }
  };

  const getBoxShadow = () => {
    if (!isHovered || effect !== 'glow') return '';

    const intensityMap = {
      light: '0 4px 12px rgba(0, 0, 0, 0.1)',
      medium: '0 8px 25px rgba(0, 0, 0, 0.15)',
      strong: '0 12px 40px rgba(0, 0, 0, 0.2)',
    };

    return intensityMap[intensity];
  };

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-300 ease-out ${className}`}
      style={{
        transform: getTransform(),
        boxShadow: getBoxShadow(),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
};