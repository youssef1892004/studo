// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, LogIn, UserPlus, Crown } from 'lucide-react';
import { Subscription } from '@/lib/types';



import SubscriptionStatus from './SubscriptionStatus';

export default function Navbar() {
  const { user, logout, isLoading, subscription } = useAuth();
  const pathname = usePathname(); 
  const router = useRouter();

  if (pathname.startsWith('/studio/')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 h-16 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
                 <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                 <div className="flex items-center gap-4">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                 </div>
            </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 h-16 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
              Ai Voice Studio
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">ABOUT</Link>
            <Link href="/docs" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">DOCS</Link>
            <Link href="/legal" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">POLICIES</Link>
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">PRICING</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {subscription && <SubscriptionStatus subscription={subscription} className="hidden lg:flex" />}
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-700 hidden sm:inline">{user.displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                  aria-label="logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                   <LogIn className="h-5 w-5 flex-shrink-0" />
                   <span>login</span>
                </Link>
                <Link href="/register" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-black">
                  <UserPlus className="h-5 w-5 flex-shrink-0" />
                  <span>register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}