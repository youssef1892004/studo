'use client';

import { useState, useEffect } from 'react';

export default function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center text-white text-center p-8">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold mb-4">عذرًا، الموقع غير متاح على الهواتف المحمولة</h1>
        <p className="text-xl">الرجاء الدخول من جهاز لوحي أو شاشة كبيرة لتجربة أفضل.</p>
      </div>
    </div>
  );
}
