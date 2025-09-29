// File path: src/contexts/ThemeContext.tsx
'use client'; // ضروري لأننا نستخدم الـ Hooks مثل useState و useEffect

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

// تحديد الأنواع (Types)
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// إنشاء السياق بقيمة افتراضية غير محددة
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// المكون المزود للسياق (The Provider Component)
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // 1. useEffect للتحميل الأولي وحفظ التفضيل
  useEffect(() => {
    if (typeof window !== 'undefined') {
        // جلب الثيم المحفوظ
        const storedTheme = localStorage.getItem('theme') as Theme;
        // جلب تفضيل نظام التشغيل
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (storedTheme) {
          setThemeState(storedTheme);
        } else {
          // استخدام تفضيل نظام التشغيل كإعداد افتراضي
          setThemeState(prefersDark ? 'dark' : 'light');
        }
    }
    setMounted(true);
  }, []);

  // 2. useEffect لتطبيق الكلاس على عنصر <html> عند تغيير الثيم
  useEffect(() => {
    // نتأكد أن المكون تم تحميله وأننا في بيئة المتصفح
    if (!mounted || typeof window === 'undefined') return;

    const root = window.document.documentElement;
    // إزالة الكلاسين القديمين وإضافة الكلاس الجديد
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    // حفظ التفضيل الجديد
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // دالة تحديث الثيم
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  // دالة التبديل بين الوضعين
  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (!mounted) {
    // هذا يمنع أي وميض (flickering) أثناء جلب الثيم من localStorage
    return <>{children}</>; 
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// الـ Hook المخصص للاستخدام السهل
export const useTheme = () => {
  const context = useContext(ThemeContext);
  // التحقق من الخطأ الذي كان يحدث سابقاً
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};