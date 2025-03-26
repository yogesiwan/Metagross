'use client';

import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import Card from '@/components/Card';
import Image from 'next/image';

// Optimized Particle animation component with reduced particle count and memoization
const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Track if component is mounted to avoid unnecessary animation
  const isMountedRef = useRef(false);
  // Track if the component is in view
  const isInViewRef = useRef(false);
  
  // Memoize particle creation to avoid recreating on re-renders
  const particles = useMemo(() => {
    // Reduced particle count for better performance
    const particleCount = 30;
    const particleArray: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particleArray.push({
        x: Math.random() * 100, // Initial percent position - will be scaled to canvas size
        y: Math.random() * 100,
        size: Math.random() * 2 + 1, // Smaller particles for better performance
        speedX: (Math.random() - 0.5) * 0.3, // Slower movement for less CPU usage
        speedY: (Math.random() - 0.5) * 0.3,
        color: `rgba(76, 130, 227, ${Math.random() * 0.4 + 0.3})` // Slightly less opacity variation
      });
    }
    
    return particleArray;
  }, []);
  
  // Setup intersection observer to only animate when in viewport
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for browsers without IntersectionObserver
      isInViewRef.current = true;
      return;
    }
    
    const observer = new IntersectionObserver((entries) => {
      isInViewRef.current = entries[0]?.isIntersecting ?? false;
    });
    
    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true }); // Request alpha channel for transparency
    if (!ctx) return;
    
    let animationFrameId: number;
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    
    // Set initial canvas size immediately
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Handle resize with debounce for better performance
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }, 200);
    };
    
    // Check if device is low-powered (mobile or tablet)
    const isLowPowered = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         window.innerWidth < 768;
    
    // Set frame skip rate based on device capability
    const frameSkipRate = isLowPowered ? 3 : 1; // Skip frames on low-powered devices
    let frameCount = 0;
    
    // Animation loop with optimized rendering
    const animate = () => {
      // Only animate if component is mounted and in view
      if (!isMountedRef.current || !isInViewRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // Skip frames for low-powered devices
      frameCount++;
      if (frameCount % frameSkipRate !== 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // Use a semi-transparent clear for a trail effect, which is more efficient than redrawing everything
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      particles.forEach(particle => {
        // Convert percentage position to actual canvas position
        const x = (particle.x / 100) * canvasWidth;
        const y = (particle.y / 100) * canvasHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Update percentage position
        particle.x += (particle.speedX * 100) / canvasWidth;
        particle.y += (particle.speedY * 100) / canvasHeight;
        
        // Wrap around edges using percentage
        if (particle.x < 0) particle.x = 100;
        if (particle.x > 100) particle.x = 0;
        if (particle.y < 0) particle.y = 100;
        if (particle.y > 100) particle.y = 0;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Important: Delay particle animation until after critical content loads
    const startAnimationTimeout = setTimeout(() => {
      isMountedRef.current = true;
      window.addEventListener('resize', handleResize);
      animationFrameId = requestAnimationFrame(animate);
    }, 3000); // Increased from 800ms to 1500ms for a longer delay
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      clearTimeout(startAnimationTimeout);
    };
  }, [particles]);
  
  // Reduced alpha value to minimize rendering cost
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-100" />;
};

// Create a lazy-loaded wrapper for the ParticleBackground
const LazyParticleBackground = () => {
  // Only render particles after hydration
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return null;
  
  return <ParticleBackground />;
};

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [typedText, setTypedText] = useState('');
  const [glowEffect, setGlowEffect] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const fullText = 'Welcome to Metagross';
  
  // Split critical and non-critical rendering
  useEffect(() => {
    // First, ensure the page layout is established
    const layoutReadyTimeout = setTimeout(() => {
      setShowAnimation(true);
    }, 500); // Increased from 100ms to 500ms to further delay animation start
    
    return () => clearTimeout(layoutReadyTimeout);
  }, []);
  
  // Optimize typing effect to run after initial render
  useEffect(() => {
    if (!showAnimation) return;
    
    let currentIndex = 0;
    let typingInterval: NodeJS.Timeout;
    
    // Delay typing effect to prioritize layout painting
    const startTypingTimeout = setTimeout(() => {
      typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setGlowEffect(true);
        }
      }, 100);
    }, 200);
    
    return () => {
      clearTimeout(startTypingTimeout);
      clearInterval(typingInterval);
    };
  }, [showAnimation]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-blue-900 relative overflow-hidden">
      {/* Only render particle animation after initial loading */}
      {showAnimation && <LazyParticleBackground />}
      
      {/* Background centered image - optimized with next/image priorities */}
      <div className={`absolute inset-0 flex items-center justify-center z-0 ${
        glowEffect ? 'opacity-50' : 'opacity-30'
      } transition-opacity duration-1000`}>
        <Image 
          src="/metagross3.png" 
          alt="Metagross Background" 
          width={600} 
          height={600}
          className="object-contain"
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdQIQJ8JpjQAAAABJRU5ErkJggg=="
          quality={65}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-12 mt-[-100px]">
          <h1 
            className={`text-5xl md:text-6xl font-bold mb-4 ${
              glowEffect ? 'text-blue-400 animate-glow' : 'text-blue-500'
            } transition-all duration-1000 ease-in-out tracking-wide`}
          >
            {typedText}
            <span className="animate-blink">|</span>
          </h1>
          
        </div>
        
        {/* Render cards immediately for faster initial loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full mt-8 animate-fadeIn-delayed">
          <Card
            title="Dashboard"
            description="View your statistics and track your progress"
            href="/dashboard"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            }
          />
          
          <Card
            title="GitHub Repository"
            description="Explore the source code and contribute to the project"
            href="https://github.com/yourgithub/metagross"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 group-hover:text-gray-200 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1 1 0 004 6.82v10.193a1 1 0 001.447.894l4-1.6a1 1 0 00.553-.894v-7.4l6.558-2.447A1 1 0 0018 4.82V3a1 1 0 00-1-1H10zm8 3.75V4.82a.148.148 0 00-.211-.134L11 7.133V16.6c0 .04-.02.077-.042.106L6 18.333V6.82a.148.148 0 01.094-.139l3.954-1.582A1 1 0 0010 4.181V3h8v2.75z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>
        
        {error && (
          <div className="bg-red-900/40 border-l-4 border-red-500 text-red-300 p-4 my-8 mx-auto max-w-md rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="mt-16 text-center animate-fadeIn-delayed">
          <p className="text-gray-400 text-sm">
            © 2025 Metagross | Powered by Salamance
          </p>
        </div>
    </div>
    </main>
  );
}