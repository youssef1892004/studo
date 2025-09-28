// src/components/Navbar.tsx
'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const authContext = useContext(AuthContext);
  const pathname = usePathname(); 
  const router = useRouter();

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

  if (isLoading) {
    return (
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 h-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
                 <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                 <div className="flex items-center gap-4">
                    <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                 </div>
            </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 transition-colors hover:text-blue-600">
              Studo
            </Link>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700 hidden sm:inline">{user.displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                  aria-label="تسجيل الخروج"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">خروج</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                   <LogIn className="h-5 w-5" />
                   <span>دخول</span>
                </Link>
                <Link href="/register" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-black transition-colors duration-200">
                  <UserPlus className="h-5 w-5" />
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