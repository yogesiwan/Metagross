'use client';

import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

export default function Badge({ status, size = 'medium' }: BadgeProps) {
  // Default to Pending for null or undefined status
  const statusText = status || 'Pending';
  
  // Determine styles based on status
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  
  switch (statusText.toLowerCase()) {
    case 'applied':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'rejected':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'interview':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'offer':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'hired':
      bgColor = 'bg-green-200';
      textColor = 'text-green-900';
      break;
    case 'declined':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      break;
    case 'expired':
      bgColor = 'bg-gray-200';
      textColor = 'text-gray-700';
      break;
  }
  
  // Determine size
  let sizeClasses = 'text-xs px-2.5 py-0.5';
  if (size === 'small') {
    sizeClasses = 'text-xs px-2 py-0.5';
  } else if (size === 'large') {
    sizeClasses = 'text-sm px-3 py-1';
  }
  
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${bgColor} ${textColor} ${sizeClasses}`}
    >
      {statusText}
    </span>
  );
} 