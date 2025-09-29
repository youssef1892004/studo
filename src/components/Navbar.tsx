// src/components/Navbar.tsx
'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext'; 
import { LogOut, User as UserIcon, LogIn, UserPlus, Sun, Moon } from 'lucide-react'; 

export default function Navbar() {
  const authContext = useContext(AuthContext);
  const pathname = usePathname(); 
  const router = useRouter();
  const { theme, toggleTheme } = useTheme(); 

  if (pathname.startsWith('/studio/')) {
    return null;
  }

  if (!authContext) {
    return null; 
  }

  const { user, logout, isLoading } = authContext;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // === تنسيقات التحميل (Skeleton Loader) مع الوضع الداكن/الفاتح ===
  if (isLoading) {
    return (
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50 h-16 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
                 <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                 <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                 </div>
            </div>
        </div>
      </header>
    );
  }

  return (
    // === تنسيقات شريط التنقل الرئيسية ===
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50 h-16 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white transition-colors hover:text-blue-600 dark:hover:text-blue-400">
              Studo
            </Link>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* === إضافة رابط حول (About) === */}
            <Link 
              href="/about" 
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              حول
            </Link>
            
            {/* === زر تبديل الثيم === */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
            >
                {/* عرض أيقونة الشمس إذا كان الوضع داكناً، والقمر إذا كان فاتحاً */}
                {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                    <Moon className="h-5 w-5 text-gray-800" />
                )}
            </button>
            {/* ======================= */}

            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">{user.displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800 dark:hover:text-white transition-colors duration-200"
                  aria-label="تسجيل الخروج"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">خروج</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                   <LogIn className="h-5 w-5 flex-shrink-0" />
                   <span>دخول</span>
                </Link>
                <Link href="/register" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-blue-600 rounded-lg hover:bg-black dark:hover:bg-blue-700 transition-colors duration-200">
                  <UserPlus className="h-5 w-5 flex-shrink-0" />
                  <span>تسجيل</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}