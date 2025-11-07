import React, { useEffect, useState } from 'react';

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  amplitude?: number;
  delay?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  duration = 3000,
  amplitude = 10,
  delay = 0,
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const startTime = Date.now() + delay;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      const newOffset = Math.sin(progress * 2 * Math.PI) * amplitude;
      setOffset(newOffset);
      requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(() => {
      animate();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [duration, amplitude, delay]);

  return (
    <div
      className={`transition-transform duration-100 ease-out ${className}`}
      style={{
        transform: `translateY(${offset}px)`,
      }}
    >
      {children}
    </div>
  );
};