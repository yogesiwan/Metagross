'use client';

import React from 'react';
import Link from 'next/link';

interface CardProps {
  title: string;
  href?: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  totalCount?: number;
  pendingCount?: number;
}

export default function Card({
  title,
  href,
  description,
  icon,
  onClick,
  isActive = false,
  totalCount,
  pendingCount,
}: CardProps) {
  const CardContent = () => (
    <div
      className={`p-4 flex flex-col gap-1 rounded-lg border border-blue-400 ${
        isActive
          ? 'bg-blue-500 border-blue-300'
          : 'bg-transparent'
      } transition-all duration-200 h-full`}
    >
      {icon && <div className="text-4xl">{icon}</div>}
      <h3 className="font-semibold text-lg text-center text-white">{title}</h3>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
      
      {totalCount !== undefined && pendingCount !== undefined && (
        <div className="mt-1 flex items-center justify-center space-x-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400">Total</span>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-sm font-medium text-gray-300">{totalCount}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400">Pending</span>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
              <span className="text-sm font-medium text-gray-300">{pendingCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="cursor-pointer">
        <CardContent />
      </Link>
    );
  }

  return (
    <div
      className={`cursor-pointer ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
    >
      <CardContent />
    </div>
  );
} 