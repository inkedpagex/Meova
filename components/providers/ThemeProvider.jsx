'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const ACCENTS = [
  {
    id: 'orange',
    name: 'Electric Orange',
    hex: '#F05A00',
    hover: '#D94E00',
    tint10: 'rgba(240, 90, 0, 0.10)',
    tint20: 'rgba(240, 90, 0, 0.20)',
    badge: 'Classic',
  },
  {
    id: 'pink',
    name: 'Hot Pink',
    hex: '#FF2E63',
    hover: '#E02656',
    tint10: 'rgba(255, 46, 99, 0.12)',
    tint20: 'rgba(255, 46, 99, 0.22)',
    badge: 'Gen-Z',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    hex: '#7C3AED',
    hover: '#6D28D9',
    tint10: 'rgba(124, 58, 237, 0.12)',
    tint20: 'rgba(124, 58, 237, 0.22)',
    badge: 'Vibrant',
  },
  {
    id: 'emerald',
    name: 'Cyber Emerald',
    hex: '#10B981',
    hover: '#059669',
    tint10: 'rgba(16, 185, 129, 0.12)',
    tint20: 'rgba(16, 185, 129, 0.22)',
    badge: 'Fresh',
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    hex: '#2563EB',
    hover: '#1D4ED8',
    tint10: 'rgba(37, 99, 235, 0.12)',
    tint20: 'rgba(37, 99, 235, 0.22)',
    badge: 'Tech',
  },
];

export const MODES = [
  { id: 'light', name: 'Crisp White', icon: 'ri-sun-line' },
  { id: 'dark', name: 'Midnight Black', icon: 'ri-moon-line' },
];

const ThemeContext = createContext({
  mode: 'light',
  accent: 'orange',
  setMode: () => {},
  setAccent: () => {},
  setTheme: () => {},
  themePreset: 'light-orange',
  setThemePreset: () => {},
  currentAccent: ACCENTS[0],
  isThemeModalOpen: false,
  openThemeModal: () => {},
  closeThemeModal: () => {},
  mounted: false,
});

export function ThemeProvider({ children, initialMode = 'light', initialAccent = 'orange' }) {
  const [mode, setModeState] = useState(initialMode);
  const [accent, setAccentState] = useState(initialAccent);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Apply theme attributes to DOM immediately
  const applyThemeToDom = useCallback((newMode, newAccent) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-mode', newMode);
    root.setAttribute('data-accent', newAccent);
    root.setAttribute('data-theme', `${newMode}-${newAccent}`);

    // Update meta theme-color for mobile browser address bar
    const selectedAccent = ACCENTS.find((a) => a.id === newAccent) || ACCENTS[0];
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newMode === 'dark' ? '#0D0D0D' : selectedAccent.hex);
    }

    // Dynamic Browser Tab Favicon matching active theme accent (Instant 0ms sync)
    try {
      const iconHref = `/favicon-${newAccent}.png`;
      const iconLinks = document.querySelectorAll("link[rel*='icon']");
      iconLinks.forEach((link) => {
        link.href = iconHref;
      });
    } catch (e) {}
  }, []);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedMode = localStorage.getItem('meova_mode') || 'light';
      const savedAccent = localStorage.getItem('meova_accent') || 'orange';
      setModeState(savedMode);
      setAccentState(savedAccent);
      applyThemeToDom(savedMode, savedAccent);
    } catch (e) {
      console.warn('ThemeProvider storage error:', e);
    }
  }, [applyThemeToDom]);

  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('meova_mode', newMode);
      document.cookie = `meova_mode=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    applyThemeToDom(newMode, accent);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: newMode, accent } }));
  }, [accent, applyThemeToDom]);

  const setAccent = useCallback((newAccent) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem('meova_accent', newAccent);
      document.cookie = `meova_accent=${newAccent}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    applyThemeToDom(mode, newAccent);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode, accent: newAccent } }));
  }, [mode, applyThemeToDom]);

  const setTheme = useCallback(({ mode: newMode, accent: newAccent }) => {
    if (newMode) setModeState(newMode);
    if (newAccent) setAccentState(newAccent);
    const m = newMode || mode;
    const a = newAccent || accent;
    try {
      localStorage.setItem('meova_mode', m);
      localStorage.setItem('meova_accent', a);
      document.cookie = `meova_mode=${m}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `meova_accent=${a}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
    applyThemeToDom(m, a);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: m, accent: a } }));
  }, [mode, accent, applyThemeToDom]);

  const setThemePreset = useCallback((presetId) => {
    const [m, a] = presetId.split('-');
    if (m && a) {
      setTheme({ mode: m, accent: a });
    }
  }, [setTheme]);

  const openThemeModal = useCallback(() => setIsThemeModalOpen(true), []);
  const closeThemeModal = useCallback(() => setIsThemeModalOpen(false), []);

  const currentAccent = ACCENTS.find((a) => a.id === accent) || ACCENTS[0];
  const themePreset = `${mode}-${accent}`;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        setMode,
        setAccent,
        setTheme,
        themePreset,
        setThemePreset,
        currentAccent,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
