import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface ThreeJSBackgroundProps {
  className?: string;
}

export const ThreeJSBackground: React.FC<ThreeJSBackgroundProps> = ({
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const geometryRef = useRef<THREE.PlaneGeometry | undefined>(undefined);
  const materialRef = useRef<THREE.ShaderMaterial | undefined>(undefined);
  const meshRef = useRef<THREE.Mesh | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Vertex shader
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment shader with dynamic morphing effects
  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_scroll;
    uniform vec2 u_resolution;
    
    varying vec2 vUv;
    
    // Noise function
    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    // Smooth noise
    float smoothNoise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Fractal noise
    float fractalNoise(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for (int i = 0; i < 6; i++) {
        value += amplitude * smoothNoise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      
      return value;
    }
    
    // Color palette based on scroll position
    vec3 getColorPalette(float t) {
      // Hero section (blue)
      vec3 color1 = vec3(0.87, 0.92, 0.98); // Light blue
      // Features section (purple)  
      vec3 color2 = vec3(0.91, 0.84, 1.0); // Light purple
      // Stats section (green)
      vec3 color3 = vec3(0.82, 0.98, 0.90); // Light green
      // CTA section (red)
      vec3 color4 = vec3(0.99, 0.79, 0.79); // Light red
      
      float section = t * 3.0; // 0-3 range for 4 sections
      
      if (section < 1.0) {
        return mix(color1, color2, section);
      } else if (section < 2.0) {
        return mix(color2, color3, section - 1.0);
      } else {
        return mix(color3, color4, section - 2.0);
      }
    }
    
    void main() {
      vec2 st = vUv;
      
      // Mouse influence
      vec2 mouseInfluence = (u_mouse - 0.5) * 0.3;
      st += mouseInfluence;
      
      // Scroll-based morphing
      float scrollInfluence = u_scroll * 0.5;
      st.y += scrollInfluence * 0.2;
      
      // Time-based animation
      float timeInfluence = u_time * 0.1;
      st += vec2(sin(timeInfluence), cos(timeInfluence * 0.7)) * 0.1;
      
      // Generate noise patterns
      float noise1 = fractalNoise(st * 3.0 + timeInfluence);
      float noise2 = fractalNoise(st * 5.0 - timeInfluence * 0.5);
      float noise3 = fractalNoise(st * 8.0 + mouseInfluence);
      
      // Combine noise patterns
      float combinedNoise = (noise1 + noise2 * 0.5 + noise3 * 0.3) / 1.8;
      
      // Get base color from scroll position
      vec3 baseColor = getColorPalette(u_scroll);
      
      // Add noise variation
      vec3 finalColor = baseColor + combinedNoise * 0.1;
      
      // Add subtle gradient overlay
      float gradient = smoothstep(0.0, 1.0, vUv.y);
      finalColor = mix(finalColor, finalColor * 1.1, gradient * 0.3);
      
      // Mouse proximity glow
      float mouseDistance = distance(vUv, u_mouse);
      float mouseGlow = 1.0 - smoothstep(0.0, 0.5, mouseDistance);
      finalColor += mouseGlow * 0.05;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Geometry and material
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_scroll: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 1;

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    geometryRef.current = geometry;
    materialRef.current = material;
    meshRef.current = mesh;

    setIsLoaded(true);

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: event.clientX / window.innerWidth,
        y: 1 - event.clientY / window.innerHeight, // Flip Y coordinate
      };
    };

    // Scroll handler
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = Math.min(scrollY / maxScroll, 1);
    };

    // Resize handler
    const handleResize = () => {
      if (!camera || !renderer || !material) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      if (material.uniforms.u_resolution) {
        material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
      }
    };

    // Animation loop
    const animate = (time: number) => {
      if (!material || !renderer || !scene || !camera) return;

      // Update uniforms
      material.uniforms.u_time.value = time * 0.001;
      material.uniforms.u_mouse.value.set(mouseRef.current.x, mouseRef.current.y);
      material.uniforms.u_scroll.value = scrollRef.current;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Start animation
    animate(0);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    } catch (error) {
      console.error('Three.js initialization failed:', error);
      setHasError(true);
    }
  }, []);

  // Fallback gradient background if Three.js fails
  if (hasError) {
    return (
      <div 
        className={`fixed inset-0 -z-10 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #dbeafe, #e9d5ff, #d1fae5, #fecaca)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
        }}
      />
    );
  }

  return (
    <div 
      ref={mountRef} 
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ 
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1s ease-in-out'
      }}
    />
  );
};