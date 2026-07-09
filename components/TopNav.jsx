// Client Component: responsive top navigation bar for Black and White Theme
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'HOME' },
  { href: '/events', label: 'EVENTS' },
  { href: '/circles', label: 'CIRCLES' },
  { href: '/profile', label: 'PROFILE' },
];

export default function TopNav({ user }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-black border-b border-[#222222] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-lg">m</span>
            </div>
            <Link href="/" className="font-extrabold text-xl text-white tracking-tight">
              meetify
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex flex-1 justify-center gap-8">
            {NAV_ITEMS.map(({ href, label }) => {
              if (href === '/profile' && !user) return null;
              
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors relative py-5 ${
                    isActive ? 'text-white' : 'text-[#888888] hover:text-white'
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center justify-end">
            {!user ? (
              <Link
                href="/login"
                className="text-xs font-extrabold text-black bg-white hover:bg-gray-200 px-5 py-2.5 rounded-full transition-colors uppercase tracking-widest"
              >
                LOG IN
              </Link>
            ) : (
              <Link href="/profile" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#333333] group-hover:border-white text-white font-bold flex items-center justify-center text-xs transition-colors">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#888888] hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-[#222222] px-4 pt-4 pb-6 space-y-2 absolute w-full left-0 shadow-2xl">
          {NAV_ITEMS.map(({ href, label }) => {
            if (href === '/profile' && !user) return null;
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-bold tracking-[0.2em] uppercase border ${
                  isActive ? 'bg-white text-black border-white' : 'text-[#888888] hover:bg-[#111111] hover:text-white border-transparent'
                }`}
              >
                {label}
              </Link>
            );
          })}
          {!user && (
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 mt-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase text-black bg-white text-center"
            >
              LOG IN
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
