// src/components/CenteredLoader.tsx
'use client';

import { LoaderCircle } from 'lucide-react';

interface CenteredLoaderProps {
  message: string;
}

export default function CenteredLoader({ message }: CenteredLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-colors duration-200">
        <LoaderCircle className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">{message}</p>
      </div>
    </div>
  );
}