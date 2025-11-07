import React, { useState, useRef, useEffect } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
  magneticRadius?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  magneticStrength = 0.3,
  magneticRadius = 100,
  onClick,
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || disabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < magneticRadius) {
        const strength = (magneticRadius - distance) / magneticRadius;
        setTransform({
          x: deltaX * strength * magneticStrength,
          y: deltaY * strength * magneticStrength,
        });
        setIsHovering(true);
      } else {
        setTransform({ x: 0, y: 0 });
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setTransform({ x: 0, y: 0 });
      setIsHovering(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [magneticStrength, magneticRadius, disabled]);

  return (
    <button
      ref={buttonRef}
      className={`
        relative transition-all duration-200 ease-out
        ${isHovering ? 'scale-110' : 'scale-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${isHovering ? 1.1 : 1})`,
        transition: isHovering ? 'none' : 'transform 0.3s ease-out',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Glow effect */}
      {isHovering && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg blur-lg opacity-30"
          style={{
            transform: 'scale(1.2)',
            zIndex: -1,
          }}
        />
      )}
      
      {children}
    </button>
  );
};