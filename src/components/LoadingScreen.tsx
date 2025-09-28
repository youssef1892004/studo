// src/components/LoadingScreen.tsx
'use client';

import { Orbit } from 'lucide-react';
import React from 'react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean; // لتحديد ما إذا كانت تغطي الشاشة بالكامل (كـ fixed overlay)
}

const LoadingScreen = ({ message = 'جاري التحميل...', fullScreen = true }: LoadingScreenProps) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-gray-50/90 backdrop-blur-sm z-50' // overlay
    : 'h-full w-full';
    
  return (
    <div className={`flex items-center justify-center ${containerClasses}`}>
      <div className="text-center space-y-4 bg-white p-6 rounded-xl shadow-2xl">
        <Orbit className="w-12 h-12 animate-spin text-gray-800 mx-auto" />
        <p className="text-gray-600 text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;