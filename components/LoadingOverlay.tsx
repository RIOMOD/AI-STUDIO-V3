
import React, { useState, useEffect } from 'react';

const MESSAGES = [
  "Initializing AI Studio...",
  "Analyzing product geometry...",
  "Rendering professional lighting...",
  "Applying commercial grade textures...",
  "Optimizing for high-resolution output...",
  "Perfecting shadows and highlights...",
  "Finalizing your masterpiece..."
];

const LoadingOverlay: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
      <h3 className="text-xl font-medium text-white mb-2 tracking-wide">
        {MESSAGES[messageIndex]}
      </h3>
      <p className="text-slate-400 text-sm">This may take a few moments</p>
    </div>
  );
};

export default LoadingOverlay;
