"use client";

import { useEffect, useRef } from 'react';

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%';

const matrixEffect = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas dimensions and scale for retina displays
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Scale the context to ensure correct resolution
  ctx.scale(dpr, dpr);
  
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops: number[] = Array(Math.floor(columns)).fill(1);

  // Add frame counting for speed control
  let frameCount = 0;
  const frameDelay = 4; // Increase this number to slow down the animation (e.g., 2 = half speed, 4 = quarter speed)

  const draw = () => {
    frameCount++;
    
    // Only update on certain frames
    if (frameCount % frameDelay === 0) {
      // Use a darker background for better visibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Brighter green for better contrast
      ctx.fillStyle = '#00FF00';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
  };

  // Run the animation
  let animationId: number;
  const animate = () => {
    draw();
    animationId = requestAnimationFrame(animate);
  };
  
  animate();

  // Return cleanup function
  return () => cancelAnimationFrame(animationId);
};

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resize
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    window.addEventListener('resize', handleResize);
    
    // Start the animation and get the cleanup function
    const cleanup = matrixEffect(canvas);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanup) {  // Only call cleanup if it's defined
        cleanup();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full opacity-15 pointer-events-none z-0"
    />
  );
}