import { useState, useEffect, useRef, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface UseMouseInteractionOptions {
  trackGlobal?: boolean;
  trackElement?: boolean;
  magneticEffect?: boolean;
  magneticStrength?: number;
  magneticRadius?: number;
}

interface UseMouseInteractionReturn {
  mousePosition: MousePosition;
  elementPosition: MousePosition;
  isHovering: boolean;
  isNearby: boolean;
  magneticOffset: MousePosition;
  elementRef: RefObject<HTMLElement | null>;
}

export const useMouseInteraction = (
  options: UseMouseInteractionOptions = {}
): UseMouseInteractionReturn => {
  const {
    trackGlobal = true,
    trackElement = true,
    magneticEffect = false,
    magneticStrength = 0.3,
    magneticRadius = 100,
  } = options;

  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [elementPosition, setElementPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [magneticOffset, setMagneticOffset] = useState<MousePosition>({ x: 0, y: 0 });
  
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!trackGlobal && !trackElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (trackGlobal) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }

      if (trackElement && elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const elementX = e.clientX - rect.left;
        const elementY = e.clientY - rect.top;
        setElementPosition({ x: elementX, y: elementY });

        // Check if mouse is nearby for magnetic effect
        if (magneticEffect) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const deltaX = e.clientX - centerX;
          const deltaY = e.clientY - centerY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance < magneticRadius) {
            setIsNearby(true);
            const strength = (magneticRadius - distance) / magneticRadius;
            setMagneticOffset({
              x: deltaX * strength * magneticStrength,
              y: deltaY * strength * magneticStrength,
            });
          } else {
            setIsNearby(false);
            setMagneticOffset({ x: 0, y: 0 });
          }
        }
      }
    };

    const handleMouseEnter = () => {
      if (trackElement) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = () => {
      if (trackElement) {
        setIsHovering(false);
        setIsNearby(false);
        setMagneticOffset({ x: 0, y: 0 });
      }
    };

    if (trackGlobal) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    if (trackElement && elementRef.current) {
      const element = elementRef.current;
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        if (trackGlobal) {
          document.removeEventListener('mousemove', handleMouseMove);
        }
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    return () => {
      if (trackGlobal) {
        document.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [trackGlobal, trackElement, magneticEffect, magneticStrength, magneticRadius]);

  return {
    mousePosition,
    elementPosition,
    isHovering,
    isNearby,
    magneticOffset,
    elementRef,
  };
};