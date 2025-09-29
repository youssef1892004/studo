// src/components/CountUpOnScroll.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration?: number; // مدة الحركة بالمللي ثانية
  suffix?: string;
  prefix?: string;
}

const CountUpOnScroll: React.FC<CountUpProps> = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // إذا كان العنصر مرئياً ولم تبدأ الحركة بعد
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime: number | null = null;
          const startCount = 0;

          const animateCount = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // حساب القيمة الحالية
            const currentValue = Math.floor(percentage * (end - startCount) + startCount);
            setCount(currentValue);

            if (percentage < 1) {
              requestAnimationFrame(animateCount);
            } else {
              setCount(end); // ضمان الوصول للقيمة النهائية
            }
          };

          requestAnimationFrame(animateCount);
        }
      },
      { threshold: 0.5 } // يبدأ العد عندما يكون 50% من العنصر مرئياً
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [end, duration]);

  // تهيئة القيمة لعرضها (خاصة لمعالجة قيمة الدولار)
  const formatValue = (value: number) => {
    if (prefix === '$') {
        // يعالج القيمة 22 ليصبح $0.22
        return `${prefix}${(value / 100).toFixed(2)}`;
    }
    return `${prefix}${value}${suffix}`;
  };

  return (
    <div ref={ref} className="inline-block tabular-nums">
      {formatValue(count)}
    </div>
  );
};

export default CountUpOnScroll;