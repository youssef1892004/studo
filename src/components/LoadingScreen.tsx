// src/components/LoadingScreen.tsx
import { LoaderCircle } from 'lucide-react';

interface LoadingScreenProps {
  message: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ message, fullScreen = false }: LoadingScreenProps) {
  return (
    // 1. حاوية التغطية (Overlay): 
    // تم إضافة dark:bg-gray-900/90 لجعل الخلفية رمادية داكنة مع شفافية 90%
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-colors duration-200 ${fullScreen ? 'h-screen w-screen' : 'absolute'}`}
    >
      
      {/* 2. صندوق التحميل الداخلي: 
          تم إضافة dark:bg-gray-800 للخلفية الداخلية 
          و dark:text-gray-200 للنص
          و dark:text-blue-400 للأيقونة 
      */}
      <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-colors duration-200">
        <LoaderCircle className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
        <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
      </div>
    </div>
  );
}