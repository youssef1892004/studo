'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {!mounted ? (
          <div>
            {children}
          </div>
        ) : (
          <>
            <Navbar />
            {children}
            <Toaster 
              position="top-left" 
              containerStyle={{ 
                top: 60,
              }} 
            />
          </>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}