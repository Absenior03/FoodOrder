import React, { useState, useEffect, useRef } from 'react';

interface Section {
  id: string;
  colors: string[];
  particleCount: number;
}

interface MorphingBackgroundProps {
  sections: Section[];
  className?: string;
}

export const MorphingBackground: React.FC<MorphingBackgroundProps> = ({
  sections,
  className = '',
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<any[]>([]);

  // Initialize particles for current section
  const initializeParticles = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const particles: any[] = [];
    for (let i = 0; i < section.particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.3 + 0.1,
        color: section.colors[Math.floor(Math.random() * section.colors.length)],
        targetColor: section.colors[Math.floor(Math.random() * section.colors.length)],
      });
    }
    particlesRef.current = particles;
  };

  // Morph particles to next section
  const morphToSection = (targetSectionIndex: number, progress: number) => {
    const targetSection = sections[targetSectionIndex];
    if (!targetSection) return;

    particlesRef.current.forEach((particle, index) => {
      // Smoothly transition colors
      const targetColor = targetSection.colors[index % targetSection.colors.length];
      particle.targetColor = targetColor;
      
      // Adjust particle count
      if (index >= targetSection.particleCount) {
        particle.opacity = Math.max(0, particle.opacity - 0.02);
      } else {
        particle.opacity = Math.min(0.7, particle.opacity + 0.02);
      }
    });

    // Add new particles if needed
    while (particlesRef.current.length < targetSection.particleCount) {
      const canvas = canvasRef.current;
      if (!canvas) break;

      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: 0,
        color: targetSection.colors[0],
        targetColor: targetSection.colors[0],
      });
    }
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      
      const progress = Math.min(scrollY / documentHeight, 1);
      setScrollProgress(progress);
      
      // Smooth section transitions - use continuous progress instead of discrete sections
      const continuousSection = progress * (sections.length - 1);
      const sectionIndex = Math.floor(continuousSection);
      const clampedIndex = Math.min(sectionIndex, sections.length - 1);
      
      if (clampedIndex !== currentSection) {
        setCurrentSection(clampedIndex);
        morphToSection(clampedIndex, progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSection, sections.length]);

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current.forEach((particle) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Boundary wrapping
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;

      // Color morphing
      if (particle.color !== particle.targetColor) {
        particle.color = particle.targetColor;
      }

      // Draw particle
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw connections
    ctx.strokeStyle = `rgba(100, 100, 100, 0.15)`;
    ctx.lineWidth = 0.5;

    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const dx = particlesRef.current[i].x - particlesRef.current[j].x;
        const dy = particlesRef.current[i].y - particlesRef.current[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          ctx.globalAlpha = (120 - distance) / 120 * 0.08;
          ctx.beginPath();
          ctx.moveTo(particlesRef.current[i].x, particlesRef.current[i].y);
          ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
          ctx.stroke();
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // Setup canvas and initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeParticles(currentSection);
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSection]);

  // Get background gradient based on current section and scroll
  const getBackgroundGradient = () => {
    const section = sections[currentSection];
    if (!section) return 'linear-gradient(135deg, #f8fafc, #e2e8f0)';

    const nextSection = sections[currentSection + 1];
    if (!nextSection) {
      return `linear-gradient(135deg, ${section.colors.join(', ')})`;
    }

    // Calculate smooth progress within current section
    const totalProgress = scrollProgress * (sections.length - 1);
    const sectionProgress = totalProgress - currentSection;
    
    // Blend colors between current and next section
    const blendedColors = section.colors.map((color, index) => {
      const nextColor = nextSection.colors[index] || nextSection.colors[0];
      // Simple color blending - in a real app you'd want proper color interpolation
      return sectionProgress > 0.7 ? nextColor : color;
    });
    
    return `linear-gradient(135deg, ${blendedColors.join(', ')})`;
  };

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      {/* Gradient background */}
      <div
        className="absolute inset-0 transition-all duration-3000 ease-in-out"
        style={{
          background: getBackgroundGradient(),
          opacity: 1,
        }}
      />
      
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-20"
      />
      
      {/* Seamless overlay for smooth transitions */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent" />
      
      {/* Subtle noise texture for depth */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};