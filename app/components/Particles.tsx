"use client"

import { useEffect, useState } from "react";

export default function Particles() {
    const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 overflow-hidden opacity-70">
      {[...Array(125)].map((_, i) => {
        const size = Math.random() * 5 + 1;
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * 5;
        const distance = Math.random() * 50 + 10;
        
        return (
          <div 
            key={i}
            className="absolute bg-white rounded-full animate-float"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animation: `float ${duration}s ease-in-out ${delay}s infinite alternate`,
              boxShadow: `0 0 ${size * 2}px ${size}px rgba(165, 243, 252, ${Math.random() * 0.3})`,
              transform: `translate(${Math.random() * distance - distance/2}px, ${Math.random() * distance - distance/2}px)`
            }}
          />
        );
      })}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(5px, 10px);
          }
          50% {
            transform: translate(10px, 5px);
          }
          75% {
            transform: translate(5px, -5px);
          }
        }
      `}</style>
    </div>
  );
}