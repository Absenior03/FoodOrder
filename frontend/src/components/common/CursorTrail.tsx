import React, { useState, useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorTrailProps {
  trailLength?: number;
  trailWidth?: number;
  trailColor?: string;
  fadeTime?: number;
  className?: string;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({
  trailLength = 20,
  trailWidth = 4,
  trailColor = '#3b82f6',
  fadeTime = 500,
  className = '',
}) => {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint: TrailPoint = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      };

      setTrail(prevTrail => {
        const updatedTrail = [newPoint, ...prevTrail.slice(0, trailLength - 1)];
        return updatedTrail.filter(point => Date.now() - point.timestamp < fadeTime);
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Clean up old points periodically
    const cleanupInterval = setInterval(() => {
      setTrail(prevTrail => 
        prevTrail.filter(point => Date.now() - point.timestamp < fadeTime)
      );
    }, 100);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(cleanupInterval);
    };
  }, [trailLength, fadeTime]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
    >
      {trail.map((point, index) => {
        const age = Date.now() - point.timestamp;
        const opacity = Math.max(0, 1 - age / fadeTime);
        const size = trailWidth * (1 - index / trailLength);

        return (
          <div
            key={`${point.timestamp}-${index}`}
            className="absolute rounded-full"
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              backgroundColor: trailColor,
              opacity,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
};