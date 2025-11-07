import React, { useState, useRef, useEffect } from 'react';

interface MouseTrackingTiltProps {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
  trackingRadius?: number;
  smoothing?: number;
}

export const MouseTrackingTilt: React.FC<MouseTrackingTiltProps> = ({
  children,
  className = '',
  tiltStrength = 15,
  trackingRadius = 200,
  smoothing = 0.1,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const targetTilt = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < trackingRadius) {
        setIsTracking(true);
        const normalizedX = deltaX / trackingRadius;
        const normalizedY = deltaY / trackingRadius;
        
        targetTilt.current = {
          x: normalizedY * tiltStrength,
          y: -normalizedX * tiltStrength,
        };
      } else {
        setIsTracking(false);
        targetTilt.current = { x: 0, y: 0 };
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [trackingRadius, tiltStrength]);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      setTilt(current => ({
        x: current.x + (targetTilt.current.x - current.x) * smoothing,
        y: current.y + (targetTilt.current.y - current.y) * smoothing,
      }));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [smoothing]);

  return (
    <div
      ref={elementRef}
      className={`transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${isTracking ? 'scale(1.02)' : 'scale(1)'}`,
      }}
    >
      {children}
    </div>
  );
};