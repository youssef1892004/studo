'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return null; 
  }

  const { user, logout, isLoading } = authContext;

  if (isLoading) {
    // ... (كود حالة التحميل كما هو)
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50 h-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
                 <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                 <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 h-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex-shrink-0">
            {/* --- === تم تحديث الرابط هنا === --- */}
            <Link href="/" className="text-2xl font-bold text-gray-800">
              Studo
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-700">{user.displayName}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  aria-label="تسجيل الخروج"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                   <LogIn className="h-5 w-5 mr-2" />
                  دخول
                </Link>
                <Link href="/register" className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  <UserPlus className="h-5 w-5 mr-2" />
                  تسجيل
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}