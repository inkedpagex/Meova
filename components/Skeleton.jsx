import React from 'react';

export default function Skeleton({ className = '', variant = 'rectangular', ...props }) {
  const baseClasses = 'animate-pulse bg-[var(--skeleton-bg,rgba(0,0,0,0.05))]';
  
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
