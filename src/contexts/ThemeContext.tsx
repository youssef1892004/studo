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
  // [تعديل] القيمة الأولية هي light لضمان عدم وجود وميض
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // 1. useEffect للتحميل الأولي وحفظ التفضيل
  useEffect(() => {
    if (typeof window !== 'undefined') {
        // [FIX] فرض الوضع الفاتح دائماً، وتجاهل localStorage وتفضيلات النظام
        setThemeState('light');
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
    // حفظ التفضيل الجديد (لحفظ تفضيل الوضع الفاتح)
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // دالة تحديث الثيم
  const setTheme = (newTheme: Theme) => {
    // [FIX] منع التحديث وفرض الوضع الفاتح
    setThemeState('light');
  };
  
  // دالة التبديل بين الوضعين
  const toggleTheme = () => {
    // [FIX] منع التبديل وفرض الوضع الفاتح
    setThemeState('light');
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