import React from 'react';

export default function Skeleton({ className = '', variant = 'rectangular', ...props }) {
  const baseClasses = 'animate-pulse bg-[#E7E5E4]/80';
  
  let variantClasses = '';
  switch (variant) {
    case 'circular':
      variantClasses = 'rounded-full';
      break;
    case 'text':
      variantClasses = 'rounded-md';
      break;
    case 'rectangular':
    default:
      variantClasses = 'rounded-2xl';
      break;
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`} 
      {...props} 
    />
  );
}
