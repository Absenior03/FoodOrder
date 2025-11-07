import React, { useState, useEffect, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface MouseInteractiveProps {
  children?: React.ReactNode;
  className?: string;
  enableParticles?: boolean;
  enableGlow?: boolean;
  enableTilt?: boolean;
}

export const MouseInteractive: React.FC<MouseInteractiveProps> = ({
  children,
  className = '',
  enableParticles = true,
  enableGlow = true,
  enableTilt = true,
}) => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });

        // Create particles on mouse movement
        if (enableParticles && isHovering) {
          const newParticle = {
            id: particleIdRef.current++,
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            opacity: 1,
          };
          setParticles(prev => [...prev.slice(-10), newParticle]);
        }
      }
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setParticles([]);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isHovering, enableParticles]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            opacity: particle.opacity - 0.05,
            y: particle.y - 1,
          }))
          .filter(particle => particle.opacity > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [particles.length]);

  const getTiltStyle = () => {
    if (!enableTilt || !isHovering || !containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (mousePosition.y - centerY) / centerY * -10;
    const rotateY = (mousePosition.x - centerX) / centerX * 10;
    
    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovering ? 1.02 : 1})`,
      transition: isHovering ? 'none' : 'transform 0.3s ease-out',
    };
  };

  const getGlowStyle = () => {
    if (!enableGlow || !isHovering) return {};
    
    return {
      boxShadow: `${mousePosition.x / 10}px ${mousePosition.y / 10}px 30px rgba(59, 130, 246, 0.3)`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...getTiltStyle(),
        ...getGlowStyle(),
      }}
    >
      {/* Gradient overlay that follows mouse */}
      {enableGlow && isHovering && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.4), transparent)`,
          }}
        />
      )}

      {/* Particles */}
      {enableParticles && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-blue-400 rounded-full pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Content */}
      {children}
      
      {/* Mouse follower dot */}
      {isHovering && (
        <div
          className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none opacity-60"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
};