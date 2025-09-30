// // src/components/LoadingScreen.tsx

// import { LoaderCircle } from 'lucide-react';

// interface LoadingScreenProps {
//   message: string;
//   fullScreen?: boolean;
// }

// export default function LoadingScreen({ message, fullScreen = false }: LoadingScreenProps) {
//   return (
//     // 1. حاوية التغطية (Overlay): 
//     // [FIX] جعل الخلفية شفافة تمامًا وإضافة pointer-events-none
//     <div 
//       className={`fixed inset-0 z-40 flex items-center justify-center bg-transparent transition-colors duration-200 ${fullScreen ? 'h-screen w-screen' : 'absolute'} pointer-events-none`}
//     >
      
//       {/* 2. صندوق التحميل الداخلي: 
//           [FIX] إضافة pointer-events-auto لجعل الصندوق مرئياً وقابلاً للتفاعل (إذا لزم الأمر، ولكن الهدف الأساسي هو السماح بالتفاعل مع الخلفية)
//       */}
//       <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl transition-colors duration-200 pointer-events-auto">
//         <LoaderCircle className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
//         <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
//       </div>
//     </div>
//   );
// }