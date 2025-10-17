// src/components/SubscriptionStatus.tsx
'use client';

import { Subscription } from '@/lib/types';
import { Crown } from 'lucide-react';

interface SubscriptionStatusProps {
  subscription: Subscription;
  className?: string;
}

const SubscriptionStatus = ({ subscription, className }: SubscriptionStatusProps) => {
  const { remaining_chars, plan } = subscription;
  const max_chars = plan.max_chars;
  const used_chars = max_chars - remaining_chars;
  const percentage = max_chars > 0 ? (used_chars / max_chars) * 100 : 0;

  // Format numbers with commas
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <div className={`flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg ${className}`}>
        <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
        <div className="w-40">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{formatNumber(remaining_chars)} Chars Left</span>
                <span className="font-semibold">{plan.name}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${100 - percentage}%` }}
                ></div>
            </div>
        </div>
    </div>
  );
};

export default SubscriptionStatus;
