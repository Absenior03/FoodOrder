import React, { useState, useEffect, useRef } from 'react';

interface CustomCursorProps {
  enabled?: boolean;
  dotColor?: string;
  outlineColor?: string;
  hoverScale?: number;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  enabled = true,
  dotColor = '#3b82f6',
  outlineColor = 'rgba(59, 130, 246, 0.5)',
  hoverScale = 1.5,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.classList.contains('cursor-pointer')) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.classList.contains('cursor-pointer')) {
        setIsHovering(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      
      // Restore default cursor
      document.body.style.cursor = 'auto';
    };
  }, [enabled]);

  useEffect(() => {
    if (dotRef.current) {
      dotRef.current.style.left = `${mousePosition.x}px`;
      dotRef.current.style.top = `${mousePosition.y}px`;
    }

    if (outlineRef.current) {
      // Delayed follow for outline
      setTimeout(() => {
        if (outlineRef.current) {
          outlineRef.current.style.left = `${mousePosition.x}px`;
          outlineRef.current.style.top = `${mousePosition.y}px`;
        }
      }, 50);
    }
  }, [mousePosition]);

  if (!enabled) return null;

  return (
    <>
      {/* Cursor dot */}
      <div
        ref={dotRef}
        className="fixed pointer-events-none z-[9999] rounded-full transition-transform duration-100 ease-out"
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: dotColor,
          transform: `translate(-50%, -50%) scale(${isClicking ? 0.5 : 1})`,
        }}
      />

      {/* Cursor outline */}
      <div
        ref={outlineRef}
        className="fixed pointer-events-none z-[9998] rounded-full border-2 transition-all duration-150 ease-out"
        style={{
          width: '32px',
          height: '32px',
          borderColor: outlineColor,
          transform: `translate(-50%, -50%) scale(${isHovering ? hoverScale : 1})`,
          opacity: isClicking ? 0.5 : 1,
        }}
      />
    </>
  );
};