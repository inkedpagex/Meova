'use client';
import React from 'react';

export default function Logo({ className = '', style = {}, width, height, size = 'md' }) {
  const presetDimensions = {
    xs: { width: '24px', height: '16px' },
    sm: { width: '32px', height: '22px' },
    md: { width: '42px', height: '28px' },
    lg: { width: '52px', height: '35px' },
  }[size] || { width: '42px', height: '28px' };

  const finalWidth = width ? (typeof width === 'number' ? `${width}px` : width) : presetDimensions.width;
  const finalHeight = height ? (typeof height === 'number' ? `${height}px` : height) : presetDimensions.height;

  return (
    <div
      role="img"
      aria-label="Meova"
      className={`inline-block flex-shrink-0 select-none transition-transform duration-200 ${className}`}
      style={{
        width: finalWidth,
        height: finalHeight,
        aspectRatio: '1024 / 682',
        backgroundColor: 'var(--accent)',
        WebkitMaskImage: "url('/logo-white.png')",
        maskImage: "url('/logo-white.png')",
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
  );
}
